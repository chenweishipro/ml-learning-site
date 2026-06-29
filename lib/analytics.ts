// 学习分析 dashboard 数据层
// 一次性返回: 4 KPI + 30 天曲线 + 课程进度 + 周热力 + 章节 + 错题
import { prisma } from "./db";
import { getAllCoursesSync } from "./content-overrides";
import { getDashboardSummary } from "./study";

export interface AnalyticsData {
  // 4 个顶部 KPI
  kpi: {
    totalMinutes: number;     // 总学习分钟数
    completedChapters: number;
    totalChapters: number;
    completionRate: number;   // 0-100
    streak: number;           // 连续打卡天数
    avgMinutesPerActiveDay: number; // 有效日均分钟
    activeDays: number;       // 30 天内有效学习天数
  };
  // 最近 30 天每日分钟数 + 完成数
  daily: Array<{ date: string; minutes: number; completed: number }>;
  // 课程进度 (按完成度排序)
  courses: Array<{
    slug: string;
    title: string;
    level: string;
    totalChapters: number;
    completedChapters: number;
    completionRate: number;
    totalMinutes: number;
  }>;
  // 最近 7 天学习分布 (周内)
  weekday: Array<{ day: number; label: string; minutes: number; count: number }>;
  // 最近 10 章进度
  recentChapters: Array<{
    courseSlug: string;
    courseTitle: string;
    chapterSlug: string;
    chapterTitle: string;
    completed: boolean;
    updatedAt: string;
    minutes: number;
  }>;
  // 错题统计
  wrongAnswers: {
    total: number;
    mastered: number;
    remaining: number;
  };
  // 一周峰值 + 总结
  insights: {
    bestDay: { date: string; minutes: number } | null;
    busiestHour: number | null;
  };
}

/**
 * 拿一个用户的学习分析数据
 * 一次查询 4 张表 + 一次内存聚合
 */
export async function getLearningAnalytics(userId: string): Promise<AnalyticsData> {
  // 1) 基础 summary (里面已有 heatmap + streak + course breakdown)
  const summary = await getDashboardSummary(userId);

  // 2) 课程目录 (拿 level 等额外字段)
  const allCourses = getAllCoursesSync();
  const courseMap = new Map(allCourses.map((c: any) => [c.slug, c]));

  // 3) 30 天每日分钟数 (来自 summary.heatmap)
  const daily = summary.heatmap;

  // 4) 课程进度 + 累计分钟数
  // 按 courseSlug 聚合 StudySession.durationSec
  const sessions30 = await prisma.studySession.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
    },
    select: { courseSlug: true, durationSec: true },
  });
  const minByCourse = new Map<string, number>();
  for (const s of sessions30) {
    minByCourse.set(s.courseSlug, (minByCourse.get(s.courseSlug) ?? 0) + s.durationSec / 60);
  }

  const courses = summary.courses
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      level: (courseMap.get(c.slug) as any)?.level ?? "beginner",
      totalChapters: c.totalChapters,
      completedChapters: c.completedChapters,
      completionRate: c.completionRate,
      totalMinutes: Math.round(minByCourse.get(c.slug) ?? 0),
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes); // 学习时长降序

  // 5) 周内分布 (近 30 天, 周一=0)
  const weekday = [
    { day: 1, label: "周一", minutes: 0, count: 0 },
    { day: 2, label: "周二", minutes: 0, count: 0 },
    { day: 3, label: "周三", minutes: 0, count: 0 },
    { day: 4, label: "周四", minutes: 0, count: 0 },
    { day: 5, label: "周五", minutes: 0, count: 0 },
    { day: 6, label: "周六", minutes: 0, count: 0 },
    { day: 0, label: "周日", minutes: 0, count: 0 },
  ];
  for (const d of daily) {
    if (d.minutes === 0) continue;
    const dt = new Date(d.date + "T00:00:00Z");
    const day = dt.getUTCDay();
    const slot = weekday.find((w) => w.day === day)!;
    slot.minutes += d.minutes;
    slot.count += 1;
  }

  // 6) 最近 10 章进度 (从 summary.recent 提取)
  const recentChapters = summary.recent
    .filter((r) => r.type === "chapter_completed" || r.type === "course_started")
    .slice(0, 10)
    .map((r) => {
      const [courseTitle, chapterTitle] = r.detail.split(" / ");
      const courseSlug = summary.courses.find((c) => c.title === courseTitle)?.slug ?? "";
      return {
        courseSlug,
        courseTitle,
        chapterSlug: "",
        chapterTitle,
        completed: r.type === "chapter_completed",
        updatedAt: r.at,
        minutes: 0,
      };
    });

  // 7) 错题统计
  // 错题来自 QuizAttempt score < 100, 但是没专门的 wrong-answers 表
  // 简化: 统计 QuizAttempt 总数 + 平均分
  const quizStats = await prisma.quizAttempt.aggregate({
    where: { userId },
    _count: { _all: true },
    _avg: { score: true },
  });

  // 8) Insights
  const sortedDaily = [...daily].sort((a, b) => b.minutes - a.minutes);
  const bestDay = sortedDaily[0] && sortedDaily[0].minutes > 0
    ? { date: sortedDaily[0].date, minutes: sortedDaily[0].minutes }
    : null;

  const activeDays = daily.filter((d) => d.minutes > 0).length;
  const avgMinutesPerActiveDay = activeDays > 0
    ? Math.round(summary.totalStudyMinutes / activeDays)
    : 0;

  return {
    kpi: {
      totalMinutes: summary.totalStudyMinutes,
      completedChapters: summary.completedChapters,
      totalChapters: summary.totalChapters,
      completionRate: summary.completionRate,
      streak: summary.streak,
      avgMinutesPerActiveDay,
      activeDays,
    },
    daily,
    courses,
    weekday,
    recentChapters,
    wrongAnswers: {
      // 没有错题本表, 改用 quiz 错误率表示
      total: quizStats._count._all,
      mastered: 0, // 暂无 mastery tracking
      remaining: Math.max(
        0,
        quizStats._count._all - Math.round((quizStats._avg.score ?? 0) / 100 * quizStats._count._all)
      ),
    },
    insights: {
      bestDay,
      busiestHour: null, // study session 没存 hour, 暂留 null
    },
  };
}