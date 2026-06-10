// 把 DB 中的课程/章节覆盖合并到基础内容上
// - 课程元数据: 字段级覆盖 (title/description/level/duration/tags/body)
// - 章节正文: 整段 MDX body 替换
//
// 性能: 读多写少, 内存缓存 5 分钟, 避免每次请求都打 DB
import { prisma } from "./db";
import { courses as baseCourses, type CourseMeta, type ChapterMeta } from "@/content/courses/_index";

const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

interface OverrideCache {
  courses: Map<string, any>;
  chapters: Map<string, any>;
  at: number;
}
let _cache: OverrideCache | null = null;

function safeParseTags(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore
  }
  return undefined;
}

interface CourseOverrideRaw {
  title: string | null;
  description: string | null;
  level: string | null;
  duration: string | null;
  tags: string | null;
  body: string | null;
}

interface ChapterOverrideRaw {
  body: string;
}

/** 应用一个 CourseOverride 到基础课程, 返回合并后的课程 */
function applyCourseOverride(base: CourseMeta, ov: CourseOverrideRaw | null): CourseMeta {
  if (!ov) return base;
  const tags = safeParseTags(ov.tags);
  return {
    ...base,
    title: ov.title ?? base.title,
    description: ov.description ?? base.description,
    level: (ov.level as CourseMeta["level"]) ?? base.level,
    duration: ov.duration ?? base.duration,
    tags: tags ?? base.tags,
  };
}

/** 加载 override 缓存, 避免每次请求都打 DB */
async function loadOverrides(): Promise<OverrideCache> {
  const now = Date.now();
  if (_cache && now - _cache.at < CACHE_TTL) return _cache;
  const [courseOv, chapterOv] = await Promise.all([
    prisma.courseOverride.findMany(),
    prisma.chapterOverride.findMany(),
  ]);
  _cache = {
    courses: new Map(courseOv.map((o) => [o.courseSlug, o])),
    chapters: new Map(chapterOv.map((o) => [`${o.courseSlug}/${o.chapterSlug}`, o])),
    at: now,
  };
  return _cache;
}

/** 失效缓存 — admin 修改内容后调用 */
export function invalidateContentCache() {
  _cache = null;
}

/** 获取所有课程(已合并 override) */
export async function getAllCoursesWithOverrides(): Promise<CourseMeta[]> {
  const cache = await loadOverrides();
  return baseCourses.map((c) => applyCourseOverride(c, cache.courses.get(c.slug) ?? null));
}

export async function getCourseWithOverrides(slug: string): Promise<CourseMeta | null> {
  const base = baseCourses.find((c) => c.slug === slug);
  if (!base) return null;
  const cache = await loadOverrides();
  return applyCourseOverride(base, cache.courses.get(slug) ?? null);
}

const chapterCache = new Map<string, { at: number; data: { meta: ChapterMeta; content: string; hasOverride: boolean } | null }>();

/**
 * 读取章节 — 优先用 DB override, fallback 到文件系统
 * 返回 { meta, content, hasOverride }
 * 整个结果按 (course, chapter) 缓存 5 分钟避免重复 DB 查
 */
export async function getChapterWithOverrides(
  courseSlug: string,
  chapterSlug: string
): Promise<{ meta: ChapterMeta; content: string; hasOverride: boolean } | null> {
  const cacheKey = `${courseSlug}/${chapterSlug}`;
  const now = Date.now();
  const hit = chapterCache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL) return hit.data;

  const course = baseCourses.find((c) => c.slug === courseSlug);
  if (!course) {
    chapterCache.set(cacheKey, { at: now, data: null });
    return null;
  }
  const baseMeta = course.chapters.find((c) => c.slug === chapterSlug);
  if (!baseMeta) {
    chapterCache.set(cacheKey, { at: now, data: null });
    return null;
  }

  // 优先用 override
  const ov = await prisma.chapterOverride.findUnique({
    where: { courseSlug_chapterSlug: { courseSlug, chapterSlug } },
  });
  if (ov) {
    const data = { meta: baseMeta, content: ov.body, hasOverride: true };
    chapterCache.set(cacheKey, { at: now, data });
    return data;
  }

  // fallback 到文件
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "content", "courses", courseSlug, `${chapterSlug}.mdx`);
  try {
    const content = await fs.readFile(filePath, "utf8");
    const data = { meta: baseMeta, content, hasOverride: false };
    chapterCache.set(cacheKey, { at: now, data });
    return data;
  } catch {
    chapterCache.set(cacheKey, { at: now, data: null });
    return null;
  }
}

/** 同步版 getAllCourses — 保持向后兼容, 仅返回 base (无 override) */


/** 同步版 getChapterWithOverrides — 同步读文件 (供 FTS 索引构建等内部同步场景使用) */
export function getChapterWithOverridesSync(
  courseSlug: string,
  chapterSlug: string
): { meta: ChapterMeta; content: string; hasOverride: boolean } | null {
  const course = baseCourses.find((c) => c.slug === courseSlug);
  if (!course) return null;
  const baseMeta = course.chapters.find((c) => c.slug === chapterSlug);
  if (!baseMeta) return null;
  const ov = _cache?.chapters.get(`${courseSlug}/${chapterSlug}`);
  if (ov) return { meta: baseMeta, content: ov.body, hasOverride: true };
  const { existsSync, readFileSync } = require("fs");
  const path = require("path");
  const filePath = path.join(process.cwd(), "content", "courses", courseSlug, `${chapterSlug}.mdx`);
  if (existsSync(filePath)) {
    return { meta: baseMeta, content: readFileSync(filePath, "utf8"), hasOverride: false };
  }
  return null;
}

export function getAllCoursesSync(): CourseMeta[] {
  return baseCourses;
}
