// 学习路径推荐 — 基于用户进度 + 课程顺序
// 策略:
//   1. 用户当前正在学哪门课 (有 in-progress 但未全完)
//   2. 按课程内部顺序, 找第一个没完成的章节
//   3. 跨课程: 推荐 prereq 关系 (e.g. 学完 ml-basics 才学 supervised-learning)
import { prisma } from "./db";
import { getAllCoursesSync } from "./content-overrides";
import type { ChapterMeta, CourseMeta } from "@/content/courses/_index";

export interface Recommendation {
  course: { slug: string; title: string };
  chapter: { slug: string; title: string; description?: string };
  reason: "in_progress" | "next_course" | "starter";
}

/** prereq 关系图: 学完哪门课才建议学哪门 */
const PREREQ: Record<string, string[]> = {
  "supervised-learning": ["ml-basics"],
  "neural-networks": ["ml-basics", "supervised-learning"],
  "deep-learning-advanced": ["neural-networks"],
  "reinforcement-learning": ["ml-basics"],
  "stats-probability": ["stats-foundations"],
  "stats-continuous": ["stats-foundations", "stats-probability"],
  "stats-estimation": ["stats-continuous"],
  "stats-testing": ["stats-estimation"],
  "stats-regression": ["stats-estimation", "stats-testing"],
};

export interface UserProgressLite {
  courseSlug: string;
  chapterSlug: string;
  completed: boolean;
}

/** 拿用户所有 chapter progress (轻量) */
export async function getUserProgressLite(userId: string): Promise<UserProgressLite[]> {
  const rows = await prisma.chapterProgress.findMany({
    where: { userId },
    select: { courseSlug: true, chapterSlug: true, completed: true },
  });
  return rows;
}

/** 推荐: 返回至多 N 个下一步学习 */
export async function recommendNext(
  userId: string,
  options: { limit?: number } = {}
): Promise<Recommendation[]> {
  const { limit = 5 } = options;
  const allCourses = getAllCoursesSync();
  const progress = await getUserProgressLite(userId);
  const completed = new Set(
    progress.filter((p) => p.completed).map((p) => `${p.courseSlug}/${p.chapterSlug}`)
  );

  const recs: Recommendation[] = [];

  // 1. 找 in-progress 课程 — 第一个未完成章节
  for (const course of allCourses) {
    if (recs.length >= limit) break;
    const completedCount = course.chapters.filter((ch) =>
      completed.has(`${course.slug}/${ch.slug}`)
    ).length;

    if (completedCount > 0 && completedCount < course.chapters.length) {
      const next = course.chapters.find((ch) => !completed.has(`${course.slug}/${ch.slug}`));
      if (next) {
        recs.push({
          course: { slug: course.slug, title: course.title },
          chapter: { slug: next.slug, title: next.title, description: next.description },
          reason: "in_progress",
        });
      }
    }
  }

  // 2. 找未开始但 prereq 已满足的课程 — 第一章
  for (const course of allCourses) {
    if (recs.length >= limit) break;
    // 跳过已在 in-progress 的
    if (recs.some((r) => r.course.slug === course.slug)) continue;
    // 跳过已 100% 完成的
    const allDone = course.chapters.every((ch) =>
      completed.has(`${course.slug}/${ch.slug}`)
    );
    if (allDone) continue;
    // 跳过有进度但还没列出来的
    const anyProgress = course.chapters.some((ch) =>
      completed.has(`${course.slug}/${ch.slug}`)
    );
    if (anyProgress) continue;

    // 验证 prereq 全部完成
    const prereqs = PREREQ[course.slug] ?? [];
    const allPrereqsDone = prereqs.every((preSlug) => {
      const pre = allCourses.find((c) => c.slug === preSlug);
      if (!pre) return true;
      return pre.chapters.every((ch) => completed.has(`${preSlug}/${ch.slug}`));
    });
    if (!allPrereqsDone) continue;

    const firstChapter = course.chapters[0];
    recs.push({
      course: { slug: course.slug, title: course.title },
      chapter: { slug: firstChapter.slug, title: firstChapter.title, description: firstChapter.description },
      reason: "next_course",
    });
  }

  // 3. 兜底: 全新用户 — 推第一门课的第二章 (假设他在学第一章)
  if (recs.length === 0 && allCourses.length > 0) {
    const first = allCourses[0];
    const second = first.chapters[1] ?? first.chapters[0];
    recs.push({
      course: { slug: first.slug, title: first.title },
      chapter: { slug: second.slug, title: second.title, description: second.description },
      reason: "starter",
    });
  }

  return recs.slice(0, limit);
}

/** 章节末尾「学完这章, 你可能想看」相关推荐 */
export interface RelatedChapter {
  course: { slug: string; title: string };
  chapter: { slug: string; title: string; description?: string; duration?: string };
  reason: "same_course" | "prereq_chain" | "next_level";
}

/** 拿到当前章节的相关推荐 (同课程后续 + 同主题 prereq) */
export function suggestRelated(
  courseSlug: string,
  chapterSlug: string,
  limit: number = 3
): RelatedChapter[] {
  const allCourses = getAllCoursesSync();
  const current = allCourses.find((c) => c.slug === courseSlug);
  if (!current) return [];

  const result: RelatedChapter[] = [];
  const seen = new Set<string>([`${courseSlug}/${chapterSlug}`]);

  const push = (c: { slug: string; title: string }, ch: { slug: string; title: string; description?: string; duration?: string }, reason: RelatedChapter["reason"]) => {
    const key = `${c.slug}/${ch.slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ course: { slug: c.slug, title: c.title }, chapter: ch, reason });
  };

  // 1) 同课程: 后续 2 个章节 (如果存在)
  const currentIdx = current.chapters.findIndex((c) => c.slug === chapterSlug);
  for (let i = currentIdx + 1; i < current.chapters.length && result.length < limit; i++) {
    push(current, current.chapters[i], "same_course");
  }

  // 2) 上层课程链: 当前 course 的 next level
  //    e.g. ml-basics → supervised-learning → neural-networks
  for (const [higher, prereqs] of Object.entries(PREREQ)) {
    if (prereqs.includes(courseSlug) && result.length < limit) {
      const hc = allCourses.find((c) => c.slug === higher);
      if (hc) push(hc, hc.chapters[0], "next_level");
    }
  }

  // 3) 同 tag 匹配 (一个 tag 即可)
  if (result.length < limit && current.tags && current.tags.length > 0) {
    const currentTags = current.tags;
    for (const other of allCourses) {
      if (other.slug === courseSlug) continue;
      if (result.length >= limit) break;
      const sharedTag = other.tags?.some((t: string) => currentTags.includes(t));
      if (sharedTag) {
        // 选中间章节 (避免 chapter 0 太简单)
        const idx = Math.min(Math.floor(other.chapters.length / 2), other.chapters.length - 1);
        push(other, other.chapters[idx], "prereq_chain");
      }
    }
  }

  return result.slice(0, limit);
}
