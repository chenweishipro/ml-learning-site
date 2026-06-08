// 把 DB 中的课程/章节覆盖合并到基础内容上
// - 课程元数据: 字段级覆盖 (title/description/level/duration/tags/body)
// - 章节正文: 整段 MDX body 替换
//
// 读多写少, 每个请求都查 DB. 生产可加内存缓存.
import { prisma } from "./db";
import { courses as baseCourses, type CourseMeta, type ChapterMeta } from "@/content/courses/_index";

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
    // body 字段是给整本 course.md 的, 暂不开放(管理员 UI 只编辑章节), 留接口
  };
}

interface ChapterOverrideRaw {
  body: string;
}

/** 获取所有课程(已合并 override) */
export async function getAllCoursesWithOverrides(): Promise<CourseMeta[]> {
  const overrides = await prisma.courseOverride.findMany();
  const map = new Map(overrides.map((o) => [o.courseSlug, o]));
  return baseCourses.map((c) => applyCourseOverride(c, map.get(c.slug) ?? null));
}

export async function getCourseWithOverrides(slug: string): Promise<CourseMeta | null> {
  const base = baseCourses.find((c) => c.slug === slug);
  if (!base) return null;
  const ov = await prisma.courseOverride.findUnique({ where: { courseSlug: slug } });
  return applyCourseOverride(base, ov);
}

/**
 * 读取章节 — 优先用 DB override, fallback 到文件系统
 * 返回 { meta, content }, meta 来自 base, content 是 MDX 字符串
 */
export async function getChapterWithOverrides(
  courseSlug: string,
  chapterSlug: string
): Promise<{ meta: ChapterMeta; content: string; hasOverride: boolean } | null> {
  const course = baseCourses.find((c) => c.slug === courseSlug);
  if (!course) return null;
  const baseMeta = course.chapters.find((c) => c.slug === chapterSlug);
  if (!baseMeta) return null;

  // 优先用 override
  const ov = await prisma.chapterOverride.findUnique({
    where: { courseSlug_chapterSlug: { courseSlug, chapterSlug } },
  });
  if (ov) {
    return { meta: baseMeta, content: ov.body, hasOverride: true };
  }

  // fallback 到文件
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "content", "courses", courseSlug, `${chapterSlug}.mdx`);
  try {
    const content = await fs.readFile(filePath, "utf8");
    return { meta: baseMeta, content, hasOverride: false };
  } catch {
    return null;
  }
}

/** 同步版 getAllCourses — 保持向后兼容, 仅返回 base (无 override) */
export function getAllCoursesSync(): CourseMeta[] {
  return baseCourses;
}
