import { promises as fs } from "fs";
import path from "path";
import { courses } from "@/content/courses/_index";
import type { ChapterMeta, CourseMeta } from "@/content/courses/_index";

/**
 * 暴露与任务规范一致的对外类型。
 * 内部实现从 _index.ts 统一导出，避免在多文件间复制定义。
 */
export type { CourseMeta, ChapterMeta };

/** MDX 源文件根目录 (相对项目根) */
const CONTENT_ROOT = path.join(process.cwd(), "content", "courses");

/** 获取所有课程元数据（按 _index.ts 声明顺序） */
export function getAllCourses(): CourseMeta[] {
  return courses;
}

/** 按 slug 获取单门课程；找不到返回 null */
export function getCourse(slug: string): CourseMeta | null {
  return courses.find((c) => c.slug === slug) ?? null;
}

/**
 * 读取单章节的 MDX 原始字符串。
 *  - 文件路径: content/courses/<slug>/<chapter>.mdx
 *  - 失败 (文件缺失 / 课程不存在) 返回 null, 由调用方决定是否 404
 *
 * 使用 fs.readFile 而非 webpack import, 是为了:
 *  1) 在 next build (SSG) 时直接读取, 不依赖任何 loader
 *  2) 用户增删 MDX 文件无需重启 dev server
 *  3) 静态导出 (next export) 仍然能解析内容
 */
export async function getChapter(
  slug: string,
  chapterSlug: string
): Promise<{ meta: ChapterMeta; content: string } | null> {
  const course = getCourse(slug);
  if (!course) return null;
  const meta = course.chapters.find((c) => c.slug === chapterSlug);
  if (!meta) return null;

  const filePath = path.join(CONTENT_ROOT, slug, `${chapterSlug}.mdx`);
  try {
    const content = await fs.readFile(filePath, "utf8");
    // 手动 strip YAML frontmatter (MDX 3+ 不会自动剥)
    const stripped = content.replace(/^---[\s\S]*?---\n?/, "");
    return { meta, content: stripped };
  } catch {
    // 文件不存在 — 返回 null, 触发 notFound()
    return null;
  }
}

/** 计算课程总章节数 */
export function getCourseChapterCount(slug: string): number {
  return getCourse(slug)?.chapters.length ?? 0;
}

/** 把章节序号 (1-based) 转成上一页 / 下一页 slug；首尾返回 null */
export function getChapterNeighbors(
  slug: string,
  chapterSlug: string
): {
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
  index: number;
  total: number;
} {
  const course = getCourse(slug);
  if (!course) return { prev: null, next: null, index: 0, total: 0 };
  const idx = course.chapters.findIndex((c) => c.slug === chapterSlug);
  if (idx < 0)
    return { prev: null, next: null, index: 0, total: course.chapters.length };
  return {
    prev: idx > 0 ? course.chapters[idx - 1] : null,
    next: idx < course.chapters.length - 1 ? course.chapters[idx + 1] : null,
    index: idx,
    total: course.chapters.length,
  };
}
