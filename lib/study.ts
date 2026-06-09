// 学习数据 API
import { prisma } from "./db";
import { getAllCoursesSync } from "./content-overrides";
import { getCourseWithOverrides } from "./content-overrides";

/** 记录一次学习 session (用户打开章节页) */
export async function recordStudySession(opts: {
  userId: string;
  courseSlug: string;
  chapterSlug: string;
  durationSec: number;
  completed: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  return prisma.studySession.upsert({
    where: {
      // 用一个虚拟的 id 不行, 用复合条件 upsert 不支持 — 改用 findFirst + create
      // 这里用最简单的: 直接 create, 允许多条 (同一天同一章可以多次学习)
      id: `${opts.userId}-${opts.courseSlug}-${opts.chapterSlug}-${today}-${Date.now()}`,
    },
    create: {
      id: `${opts.userId}-${opts.courseSlug}-${opts.chapterSlug}-${today}-${Date.now()}-${Math.random()}`,
      userId: opts.userId,
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug,
      durationSec: opts.durationSec,
      studyDate: today,
      completed: opts.completed,
    },
    update: {},
  });
}

interface DashboardSummary {
  // 总览
  totalChapters: number;
  completedChapters: number;
  inProgressChapters: number;
  /** 0-100 */
  completionRate: number;
  // 课程维度
  courses: Array<{
    slug: string;
    title: string;
    totalChapters: number;
    completedChapters: number;
    completionRate: number;
  }>;
  // 时间维度
  memberSinceDays: number;
  totalStudyMinutes: number;
  /** 连续打卡天数 */
  streak: number;
  /** 最近 30 天每天的学习分钟数 (yyyy-mm-dd -> minutes) */
  heatmap: Array<{ date: string; minutes: number; completed: number }>;
  // 贡献
  proposalsSubmitted: number;
  proposalsMerged: number;
  // 证书
  certificates: Array<{ courseSlug: string; title: string; issuedAt: string; serialNo: string }>;
  // 最新活动
  recent: Array<{
    type: "chapter_completed" | "course_started" | "proposal_merged" | "certificate_issued";
    title: string;
    detail: string;
    at: string;
  }>;
}

/** 汇总用户学习数据 */
export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  // 1. 拉所有课程
  const allCourses = getAllCoursesSync();
  const totalChapters = allCourses.reduce((sum: number, c: any) => sum + c.chapters.length, 0);

  // 2. 拿用户的进度
  const progress = await prisma.chapterProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const completedChapters = progress.filter((p) => p.completed).length;

  // 3. 按课程分组
  const courses: DashboardSummary["courses"] = [];
  for (const c of allCourses) {
    const courseTotal = c.chapters.length;
    const courseCompleted = progress.filter(
      (p) => p.courseSlug === c.slug && p.completed
    ).length;
    courses.push({
      slug: c.slug,
      title: c.title,
      totalChapters: courseTotal,
      completedChapters: courseCompleted,
      completionRate: courseTotal === 0 ? 0 : (courseCompleted / courseTotal) * 100,
    });
  }

  // 4. 用户注册时长
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  const memberSinceDays = user
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 3600 * 1000))
    : 0;

  // 5. 学习 session (最近 30 天)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
  });
  const totalStudyMinutes = Math.round(
    sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60
  );

  // 6. 热力图: 按日聚合
  const byDate = new Map<string, { minutes: number; completed: number }>();
  for (const s of sessions) {
    const cur = byDate.get(s.studyDate) ?? { minutes: 0, completed: 0 };
    cur.minutes += s.durationSec / 60;
    if (s.completed) cur.completed += 1;
    byDate.set(s.studyDate, cur);
  }
  // 填齐最近 30 天
  const heatmap: DashboardSummary["heatmap"] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = byDate.get(key) ?? { minutes: 0, completed: 0 };
    heatmap.push({ date: key, minutes: Math.round(v.minutes), completed: v.completed });
  }

  // 7. 连续打卡 (从今天往回数连续有学习的日期)
  const allDates = new Set<string>();
  const allSessions = await prisma.studySession.findMany({
    where: { userId },
    select: { studyDate: true },
  });
  for (const s of allSessions) allDates.add(s.studyDate);
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (allDates.has(d.toISOString().slice(0, 10))) {
      streak++;
    } else if (i > 0) {
      break; // 中断
    }
  }

  // 8. 贡献统计
  const proposalsSubmitted = await prisma.contentProposal.count({
    where: { authorId: userId },
  });
  const proposalsMerged = await prisma.contentProposal.count({
    where: { authorId: userId, status: "merged" },
  });

  // 9. 证书
  const certs = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
  });
  const certificates = certs.map((c) => {
    const course = allCourses.find((ac: any) => ac.slug === c.courseSlug);
    return {
      courseSlug: c.courseSlug,
      title: course?.title ?? c.courseSlug,
      issuedAt: c.issuedAt.toISOString(),
      serialNo: c.serialNo,
    };
  });

  // 10. 最近活动 (从 progress + proposals + certificates 合并)
  const recent: DashboardSummary["recent"] = [];
  for (const p of progress.slice(0, 8)) {
    const course = allCourses.find((c: any) => c.slug === p.courseSlug);
    const chapter = course?.chapters.find((ch) => ch.slug === p.chapterSlug);
    if (!course) continue;
    recent.push({
      type: p.completed ? "chapter_completed" : "course_started",
      title: p.completed ? "✅ 完成了章节" : "📖 开始学习章节",
      detail: `${course.title} / ${chapter?.title ?? p.chapterSlug}`,
      at: p.updatedAt.toISOString(),
    });
  }
  for (const pr of await prisma.contentProposal.findMany({
    where: { authorId: userId, status: "merged" },
    orderBy: { mergedAt: "desc" },
    take: 5,
  })) {
    recent.push({
      type: "proposal_merged",
      title: "🎉 提案被采纳",
      detail: pr.title,
      at: pr.mergedAt?.toISOString() ?? pr.updatedAt.toISOString(),
    });
  }
  for (const c of certs.slice(0, 5)) {
    const course = allCourses.find((ac: any) => ac.slug === c.courseSlug);
    recent.push({
      type: "certificate_issued",
      title: "🏆 获得证书",
      detail: course?.title ?? c.courseSlug,
      at: c.issuedAt.toISOString(),
    });
  }
  recent.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    totalChapters,
    completedChapters,
    inProgressChapters: totalChapters - completedChapters,
    completionRate: totalChapters === 0 ? 0 : (completedChapters / totalChapters) * 100,
    courses,
    memberSinceDays,
    totalStudyMinutes,
    streak,
    heatmap,
    proposalsSubmitted,
    proposalsMerged,
    certificates,
    recent: recent.slice(0, 10),
  };
}

/** 获取/创建学习计划 */
export async function getActiveStudyPlan(userId: string) {
  return prisma.studyPlan.findFirst({
    where: { userId, active: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertStudyPlan(opts: {
  userId: string;
  courseSlug: string;
  dailyTarget: number;
  targetDate?: Date | null;
}) {
  // 先禁用所有现有计划
  await prisma.studyPlan.updateMany({
    where: { userId: opts.userId, active: true },
    data: { active: false },
  });
  return prisma.studyPlan.create({
    data: {
      userId: opts.userId,
      courseSlug: opts.courseSlug,
      dailyTarget: opts.dailyTarget,
      targetDate: opts.targetDate ?? null,
      active: true,
    },
  });
}

/** 颁发证书: 一门课所有章节都完成后 */
export async function issueCertificateIfEarned(opts: {
  userId: string;
  courseSlug: string;
}): Promise<{ issued: boolean; serialNo?: string; issuedAt?: string }> {
  const course = await getCourseWithOverrides(opts.courseSlug);
  if (!course) return { issued: false };
  const totalChapters = course.chapters.length;
  if (totalChapters === 0) return { issued: false };

  const completed = await prisma.chapterProgress.count({
    where: { userId: opts.userId, courseSlug: opts.courseSlug, completed: true },
  });
  if (completed < totalChapters) return { issued: false };

  // 检查是否已有
  const existing = await prisma.certificate.findUnique({
    where: {
      userId_courseSlug: {
        userId: opts.userId,
        courseSlug: opts.courseSlug,
      },
    },
  });
  if (existing) return { issued: false, serialNo: existing.serialNo, issuedAt: existing.issuedAt.toISOString() };

  // 生成证书
  const serialNo = `ML-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const cert = await prisma.certificate.create({
    data: {
      userId: opts.userId,
      courseSlug: opts.courseSlug,
      serialNo,
      finalScore: 100,
    },
  });
  return { issued: true, serialNo: cert.serialNo, issuedAt: cert.issuedAt.toISOString() };
}
