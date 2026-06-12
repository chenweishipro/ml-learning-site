// 管理员学习数据汇总
import { prisma } from "./db";
import { getAllCoursesSync } from "./content-overrides";

export interface AdminAnalytics {
  // 总览
  totalUsers: number;
  activeUsersLast7d: number;
  activeUsersLast30d: number;
  totalSessions: number;
  totalMinutes: number;
  totalProgress: number;
  totalComments: number;
  totalQuestions: number;
  totalProposals: number;
  // 课程维度
  courses: Array<{
    slug: string;
    title: string;
    chapterCount: number;
    totalMinutes: number;
    uniqueLearners: number;
    completionRate: number; // 平均完成率
    avgDurationMin: number; // 平均学习时长
  }>;
  // 章节热度
  topChapters: Array<{
    courseSlug: string;
    chapterSlug: string;
    title: string;
    sessions: number;
    minutes: number;
  }>;
  // 用户贡献
  topContributors: Array<{
    userId: string;
    email: string;
    displayName: string | null;
    progress: number;
    sessions: number;
    proposals: number;
    comments: number;
  }>;
  // 学习高峰日
  weekday: Array<{ dow: number; minutes: number }>; // 0=Sun
  hourly: Array<{ hour: number; minutes: number }>; // 0-23
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date();
  const last7d = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  // 总览
  const [
    totalUsers,
    activeSessions7d,
    activeSessions30d,
    allSessions,
    totalProgress,
    totalComments,
    totalQuestions,
    totalProposals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.studySession.findMany({ where: { createdAt: { gte: last7d } }, select: { userId: true }, distinct: ["userId"] }),
    prisma.studySession.findMany({ where: { createdAt: { gte: last30d } }, select: { userId: true }, distinct: ["userId"] }),
    prisma.studySession.findMany({ select: { durationSec: true, userId: true, courseSlug: true, chapterSlug: true, studyDate: true, createdAt: true, completed: true } }),
    prisma.chapterProgress.count(),
    prisma.comment.count(),
    prisma.question.count(),
    prisma.contentProposal.count(),
  ]);

  const totalMinutes = Math.round(allSessions.reduce((s, x) => s + x.durationSec, 0) / 60);
  const activeUsers7d = activeSessions7d.length;
  const activeUsers30d = activeSessions30d.length;

  // 课程维度
  const allCourses = getAllCoursesSync();
  const sessionsByCourse = new Map<string, { minutes: number; users: Set<string> }>();
  for (const s of allSessions) {
    const cur = sessionsByCourse.get(s.courseSlug) ?? { minutes: 0, users: new Set() };
    cur.minutes += s.durationSec;
    cur.users.add(s.userId);
    sessionsByCourse.set(s.courseSlug, cur);
  }
  const progressByCourse = await prisma.chapterProgress.groupBy({
    by: ["courseSlug"],
    _count: { _all: true },
  });
  const progressMap = new Map(progressByCourse.map((p) => [p.courseSlug, p._count._all]));

  const courses = allCourses
    .map((c) => {
      const sess = sessionsByCourse.get(c.slug) ?? { minutes: 0, users: new Set() };
      const totalCh = c.chapters.length;
      const progress = progressMap.get(c.slug) ?? 0;
      const completionRate = totalCh > 0 ? Math.min(100, (progress / (sess.users.size || 1)) / totalCh * 100) : 0;
      const avgDur = sess.users.size > 0 ? Math.round(sess.minutes / sess.users.size / totalCh) : 0;
      return {
        slug: c.slug,
        title: c.title,
        chapterCount: totalCh,
        totalMinutes: Math.round(sess.minutes / 60),
        uniqueLearners: sess.users.size,
        completionRate: Math.round(completionRate),
        avgDurationMin: avgDur,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // 章节热度
  const chapterAgg = new Map<string, { sessions: number; minutes: number; courseSlug: string; chapterSlug: string; title: string }>();
  for (const s of allSessions) {
    const key = `${s.courseSlug}/${s.chapterSlug}`;
    const cur = chapterAgg.get(key) ?? { sessions: 0, minutes: 0, courseSlug: s.courseSlug, chapterSlug: s.chapterSlug, title: s.chapterSlug };
    cur.sessions += 1;
    cur.minutes += s.durationSec;
    chapterAgg.set(key, cur);
  }
  const topChapters = Array.from(chapterAgg.values())
    .map((c) => {
      const course = allCourses.find((x) => x.slug === c.courseSlug);
      const chapter = course?.chapters.find((x) => x.slug === c.chapterSlug);
      return { ...c, title: chapter?.title ?? c.chapterSlug };
    })
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10)
    .map((c) => ({
      courseSlug: c.courseSlug,
      chapterSlug: c.chapterSlug,
      title: c.title,
      sessions: c.sessions,
      minutes: Math.round(c.minutes / 60),
    }));

  // 用户贡献
  const users = await prisma.user.findMany({ select: { id: true, email: true, displayName: true } });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const progressByUser = await prisma.chapterProgress.groupBy({ by: ["userId"], _count: { _all: true } });
  const progressUserMap = new Map(progressByUser.map((p) => [p.userId, p._count._all]));
  const sessionCountByUser = new Map<string, number>();
  for (const s of allSessions) sessionCountByUser.set(s.userId, (sessionCountByUser.get(s.userId) ?? 0) + 1);
  const proposalCountByUser = await prisma.contentProposal.groupBy({ by: ["authorId"], _count: { _all: true } });
  const proposalMap = new Map(proposalCountByUser.map((p) => [p.authorId, p._count._all]));
  const commentCountByUser = await prisma.comment.groupBy({ by: ["authorId"], _count: { _all: true } });
  const commentMap = new Map(commentCountByUser.map((p) => [p.authorId, p._count._all]));
  const topContributors = users
    .map((u) => ({
      userId: u.id,
      email: u.email,
      displayName: u.displayName,
      progress: progressUserMap.get(u.id) ?? 0,
      sessions: sessionCountByUser.get(u.id) ?? 0,
      proposals: proposalMap.get(u.id) ?? 0,
      comments: commentMap.get(u.id) ?? 0,
    }))
    .filter((u) => u.progress > 0 || u.sessions > 0 || u.proposals > 0 || u.comments > 0)
    .sort((a, b) => b.progress + b.sessions * 0.5 + b.proposals * 2 + b.comments - (a.progress + a.sessions * 0.5 + a.proposals * 2 + a.comments))
    .slice(0, 10);

  // 高峰时段
  const weekday = Array.from({ length: 7 }, () => 0);
  const hourly = Array.from({ length: 24 }, () => 0);
  for (const s of allSessions) {
    weekday[s.createdAt.getUTCDay()] += s.durationSec;
    hourly[s.createdAt.getUTCHours()] += s.durationSec;
  }
  return {
    totalUsers,
    activeUsersLast7d: activeUsers7d,
    activeUsersLast30d: activeUsers30d,
    totalSessions: allSessions.length,
    totalMinutes,
    totalProgress,
    totalComments,
    totalQuestions,
    totalProposals,
    courses,
    topChapters,
    topContributors,
    weekday: weekday.map((m, dow) => ({ dow, minutes: Math.round(m / 60) })),
    hourly: hourly.map((m, h) => ({ hour: h, minutes: Math.round(m / 60) })),
  };
}
