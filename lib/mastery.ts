/** 知识点掌握度 (v19.8)
 *
 * 基于用户 ChapterProgress + courses 元数据, 计算:
 *  - 每个课程的完成度 (%)
 *  - 入门/进阶/高级 3 个 level 的总体掌握度
 *  - "知识盲点" (低掌握度的高优先级课程)
 */
import { prisma } from "./db";
import { getAllCourses } from "./content";
import type { CourseMeta } from "@/content/courses/_index";

export type Level = "beginner" | "advanced" | "expert";

export interface CourseMastery {
  slug: string;
  title: string;
  level: Level;
  /** 0..1 */
  completion: number;
  totalChapters: number;
  completedChapters: number;
  startedChapters: number;
  /** 简单分类 */
  status: "untouched" | "in-progress" | "mastered";
}

export interface LevelMastery {
  level: Level;
  label: string;
  /** 加权平均 (按总章节数加权) */
  average: number;
  courseCount: number;
  chapterCount: number;
  completedChapterCount: number;
}

export interface MasteryReport {
  userId: string;
  /** 总体完成度 (0..1) */
  overall: number;
  /** 各 level */
  byLevel: LevelMastery[];
  /** 各课程 */
  courses: CourseMastery[];
  /** 知识盲点: 未掌握的高 level 课程 (advanced/expert) */
  blindSpots: CourseMastery[];
  /** 强项: 已掌握 ≥ 80% 的课程 */
  strengths: CourseMastery[];
  /** 总统计 */
  total: { courses: number; chapters: number; completedChapters: number; inProgressChapters: number };
}

const LEVEL_LABEL: Record<Level, string> = {
  beginner: "入门",
  advanced: "进阶",
  expert: "高级",
};

export async function calculateMastery(userId: string): Promise<MasteryReport> {
  const courses = getAllCourses() as CourseMeta[];

  // 拉所有 chapter progress
  const progress = await prisma.chapterProgress.findMany({
    where: { userId },
    select: { courseSlug: true, chapterSlug: true, completed: true },
  });

  // Index by course
  const progressByCourse = new Map<string, typeof progress>();
  for (const p of progress) {
    if (!progressByCourse.has(p.courseSlug)) progressByCourse.set(p.courseSlug, []);
    progressByCourse.get(p.courseSlug)!.push(p);
  }

  let totalChapters = 0;
  let totalCompleted = 0;
  let totalInProgress = 0;

  const courseMasteries: CourseMastery[] = courses.map((c) => {
    const total = c.chapters?.length ?? 0;
    const ps = progressByCourse.get(c.slug) ?? [];
    const completed = ps.filter((p) => p.completed).length;
    const inProgress = ps.filter((p) => !p.completed).length;
    const ratio = total > 0 ? completed / total : 0;

    let status: CourseMastery["status"];
    if (ratio >= 1) status = "mastered";
    else if (ratio > 0 || ps.length > 0) status = "in-progress";
    else status = "untouched";

    totalChapters += total;
    totalCompleted += completed;
    totalInProgress += inProgress;

    return {
      slug: c.slug,
      title: c.title,
      level: (c.level as Level) ?? "beginner",
      completion: ratio,
      totalChapters: total,
      completedChapters: completed,
      startedChapters: inProgress,
      status,
    };
  });

  // 按 level 分组 (加权平均按章节数)
  const byLevel: LevelMastery[] = (["beginner", "advanced", "expert"] as Level[]).map((lv) => {
    const cs = courseMasteries.filter((c) => c.level === lv);
    const totalW = cs.reduce((s, c) => s + c.totalChapters, 0);
    const sumW = cs.reduce((s, c) => s + c.totalChapters * c.completion, 0);
    const completedChapterCount = cs.reduce((s, c) => s + c.completedChapters, 0);
    return {
      level: lv,
      label: LEVEL_LABEL[lv],
      average: totalW > 0 ? sumW / totalW : 0,
      courseCount: cs.length,
      chapterCount: totalW,
      completedChapterCount,
    };
  });

  const blindSpots = courseMasteries
    .filter((c) => c.level !== "beginner" && c.completion < 0.3 && c.totalChapters > 0)
    .sort((a, b) => b.level.localeCompare(a.level) - (a.completion - b.completion))
    .slice(0, 6);

  const strengths = courseMasteries
    .filter((c) => c.completion >= 0.8)
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 6);

  const overall = totalChapters > 0 ? totalCompleted / totalChapters : 0;

  return {
    userId,
    overall,
    byLevel,
    courses: courseMasteries,
    blindSpots,
    strengths,
    total: {
      courses: courseMasteries.length,
      chapters: totalChapters,
      completedChapters: totalCompleted,
      inProgressChapters: totalInProgress,
    },
  };
}

export const LEVEL_LABEL_MAP = LEVEL_LABEL;
