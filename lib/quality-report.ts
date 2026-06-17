/** admin 章节质量报告数据 */
import { prisma } from "@/lib/db";
import { getAllCourses } from "@/lib/content";
import { promises as fs } from "fs";
import path from "path";

export interface ChapterQuality {
  courseSlug: string;
  chapterSlug: string;
  chapterTitle: string;
  /** 唯一浏览/完成人数 */
  totalUsers: number;
  completedUsers: number;
  completionRate: number; // 0-1
  /** 平均学习时长 (秒) */
  avgDurationSec: number;
  /** 错题数 (去重后) */
  wrongAnswers: number;
  /** 笔记数 */
  notesCount: number;
  /** 评论数 (scope=chapter) */
  commentsCount: number;
  /** 最近 30 天活跃人数 */
  active30d: number;
  /** 质量分 (0-100, 越高越好) */
  qualityScore: number;
  /** 状态: ok / warn / bad */
  status: "ok" | "warn" | "bad";
  /** 状态原因 */
  reasons: string[];
}

function score(s: Omit<ChapterQuality, "qualityScore" | "status" | "reasons">): {
  score: number;
  status: "ok" | "warn" | "bad";
  reasons: string[];
} {
  let pts = 100;
  const reasons: string[] = [];
  // 完成率 < 30% 扣分 (但注意冷启动 - 用户数 < 5 时不扣)
  if (s.totalUsers >= 5) {
    if (s.completionRate < 0.3) {
      pts -= 25;
      reasons.push(`完成率仅 ${(s.completionRate * 100).toFixed(0)}%`);
    } else if (s.completionRate < 0.5) {
      pts -= 10;
      reasons.push(`完成率 ${(s.completionRate * 100).toFixed(0)}% 偏低`);
    }
  }
  // 错题多 (>5 且 用户多) 扣分
  if (s.totalUsers >= 5 && s.wrongAnswers >= 5) {
    if (s.wrongAnswers >= 15) {
      pts -= 20;
      reasons.push(`${s.wrongAnswers} 道错题, 内容可能偏难`);
    } else {
      pts -= 8;
      reasons.push(`${s.wrongAnswers} 道错题`);
    }
  }
  // 笔记多 加分
  if (s.notesCount >= 3) {
    pts += Math.min(10, s.notesCount);
  } else if (s.notesCount === 0 && s.totalUsers >= 5) {
    pts -= 5;
    reasons.push("用户未做笔记");
  }
  // 评论 加分
  if (s.commentsCount >= 2) {
    pts += Math.min(5, s.commentsCount);
  }
  // 活跃 + 加分
  if (s.active30d >= 3) {
    pts += 3;
  } else if (s.active30d === 0 && s.totalUsers >= 3) {
    pts -= 5;
    reasons.push("近 30 天无活跃");
  }
  // 限时: 学习时长过短 (< 60s) 表示可能没真读
  if (s.totalUsers >= 5 && s.avgDurationSec > 0 && s.avgDurationSec < 60) {
    pts -= 8;
    reasons.push("平均时长 < 1 分钟, 可能没读完");
  }
  const score = Math.max(0, Math.min(100, pts));
  const status: "ok" | "warn" | "bad" = score >= 80 ? "ok" : score >= 60 ? "warn" : "bad";
  return { score, status, reasons };
}

export async function getChapterQuality(): Promise<ChapterQuality[]> {
  const courses = getAllCourses();
  const result: ChapterQuality[] = [];
  for (const course of courses) {
    for (const ch of course.chapters) {
      const [progress, sessions, wrongCount, notes, comments, active30] = await Promise.all([
        prisma.chapterProgress.findMany({
          where: { courseSlug: course.slug, chapterSlug: ch.slug },
          select: { userId: true, completed: true },
        }),
        prisma.studySession.findMany({
          where: { courseSlug: course.slug, chapterSlug: ch.slug },
          select: { userId: true, durationSec: true },
        }),
        prisma.quizWrong.count({
          where: { courseSlug: course.slug, chapterSlug: ch.slug },
        }).catch(() => 0),
        prisma.note.count({
          where: { courseSlug: course.slug, chapterSlug: ch.slug },
        }).catch(() => 0),
        prisma.comment.count({
          where: { scope: "chapter", courseSlug: course.slug, chapterSlug: ch.slug },
        }).catch(() => 0),
        prisma.studySession.findMany({
          where: {
            courseSlug: course.slug,
            chapterSlug: ch.slug,
            createdAt: { gte: new Date(Date.now() - 30 * 86400_000) },
          },
          select: { userId: true },
          distinct: ["userId"],
        }),
      ]);

      const totalUsers = new Set(progress.map((p) => p.userId)).size;
      const completedUsers = progress.filter((p) => p.completed).length;
      const completionRate = totalUsers > 0 ? completedUsers / totalUsers : 0;
      const totalDuration = sessions.reduce((s, x) => s + (x.durationSec || 0), 0);
      const avgDurationSec = sessions.length > 0 ? totalDuration / sessions.length : 0;
      const active30d = active30.length;
      const partial: Omit<ChapterQuality, "qualityScore" | "status" | "reasons"> = {
        courseSlug: course.slug,
        chapterSlug: ch.slug,
        chapterTitle: ch.title,
        totalUsers,
        completedUsers,
        completionRate,
        avgDurationSec,
        wrongAnswers: wrongCount,
        notesCount: notes,
        commentsCount: comments,
        active30d,
      };
      const { score: qualityScore, status, reasons } = score(partial);
      result.push({ ...partial, qualityScore, status, reasons });
    }
  }
  return result;
}

/** 课程级别聚合 */
export interface CourseQuality {
  slug: string;
  title: string;
  chaptersCount: number;
  avgQualityScore: number;
  badCount: number;
  warnCount: number;
  okCount: number;
}

export async function getCourseQuality(): Promise<CourseQuality[]> {
  const all = await getChapterQuality();
  const courses = getAllCourses();
  return courses.map((c) => {
    const cs = all.filter((q) => q.courseSlug === c.slug);
    const avgQualityScore = cs.length > 0
      ? cs.reduce((s, x) => s + x.qualityScore, 0) / cs.length
      : 0;
    return {
      slug: c.slug,
      title: c.title,
      chaptersCount: c.chapters.length,
      avgQualityScore,
      badCount: cs.filter((x) => x.status === "bad").length,
      warnCount: cs.filter((x) => x.status === "warn").length,
      okCount: cs.filter((x) => x.status === "ok").length,
    };
  });
}

/** AI 出题缓存命中统计 (admin 看板用) */
export async function getAIQuizCacheStats(): Promise<{ totalCached: number; totalSizeKB: number }> {
  const dir = path.join(process.cwd(), "content", "courses", ".ai-quiz-cache");
  try {
    const files = await fs.readdir(dir);
    let totalSize = 0;
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const stat = await fs.stat(path.join(dir, f));
      totalSize += stat.size;
    }
    return { totalCached: files.filter((f) => f.endsWith(".json")).length, totalSizeKB: Math.round(totalSize / 1024) };
  } catch {
    return { totalCached: 0, totalSizeKB: 0 };
  }
}
