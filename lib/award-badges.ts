/** 收集用户当前 stats 然后检查 + 颁发新徽章 */
import { prisma } from "@/lib/db";
import { BADGES, type BadgeState } from "./badges";

export async function computeBadgeState(userId: string): Promise<BadgeState> {
  // 完成章节数
  const chaptersCompleted = await prisma.chapterProgress.count({
    where: { userId, completed: true },
  });

  // 完整学完的课 (>=80% 章节) - 从 _index.ts 静态取课程章节数
  const { getAllCourses } = await import("@/lib/content");
  let coursesCompleted = 0;
  const COURSES = getAllCourses();
  for (const c of COURSES) {
    if (c.chapters.length === 0) continue;
    const done = await prisma.chapterProgress.count({
      where: { userId, completed: true, courseSlug: c.slug },
    });
    if (done / c.chapters.length >= 0.8) coursesCompleted++;
  }

  // 答对题数
  // quizzesPassed: 估算 (完成章节 * 平均5题) - 错题数
  const wrongTotal = await prisma.quizWrong.count({ where: { userId } }).catch(() => 0);
  const quizzesPassed = Math.max(0, chaptersCompleted * 5 - wrongTotal);

  // 连续天数
  const sessions = await prisma.studySession.findMany({
    where: { userId },
    select: { studyDate: true },
    orderBy: { studyDate: "desc" },
  });
  const datesSet = new Set(sessions.map((s) => String(s.studyDate).slice(0, 10)));
  let consecutiveDays = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (datesSet.has(key)) {
      consecutiveDays++;
    } else if (i > 0) {
      break;
    }
  }
  // longest streak
  const allDates = Array.from(datesSet).sort();
  let longestStreak = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const d of allDates) {
    const dd = new Date(d);
    if (prev) {
      const diff = (dd.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        cur++;
      } else {
        cur = 1;
      }
    } else {
      cur = 1;
    }
    if (cur > longestStreak) longestStreak = cur;
    prev = dd;
  }

  // 总学习秒数
  const sum = await prisma.studySession.aggregate({
    where: { userId },
    _sum: { durationSec: true },
  });
  const totalHours = (sum._sum.durationSec || 0) / 3600;

  // 编程题通过
  const codingChallengesPassed = await prisma.codingSubmission.count({
    where: { userId, passed: true },
  }).catch(() => 0);

  // 注释/笔记/提案/证书
  const [commentsCount, notesCount, proposalsApproved, wrongCount, certificatesCount] = await Promise.all([
    prisma.comment.count({ where: { authorId: userId } }).catch(() => 0),
    prisma.note.count({ where: { userId } }).catch(() => 0),
    Promise.resolve(0), // proposal model has no userId in this version
    prisma.quizWrong.count({ where: { userId, resolved: false } }).catch(() => 0),
    prisma.certificate.count({ where: { userId } }).catch(() => 0),
  ]);

  return {
    userId,
    chaptersCompleted,
    coursesCompleted,
    quizzesPassed,
    consecutiveDays,
    longestStreak,
    totalHours,
    codingChallengesPassed,
    commentsCount,
    notesCount,
    proposalsApproved,
    wrongResolvedAll: wrongCount === 0,
    certificatesCount,
  };
}

export async function awardEligibleBadges(userId: string): Promise<Array<{ badgeId: string; context?: string }>> {
  const state = await computeBadgeState(userId);
  const earned = await prisma.userBadge.findMany({ where: { userId } });
  const earnedIds = new Set(earned.map((b) => b.badgeId));

  const newly: Array<{ badgeId: string; context?: string }> = [];
  for (const b of BADGES) {
    if (earnedIds.has(b.id)) continue;
    const r = await b.check(state);
    if (r.earned) {
      await prisma.userBadge.create({
        data: { userId, badgeId: b.id, context: r.context },
      });
      newly.push({ badgeId: b.id, context: r.context });
    }
  }
  return newly;
}
