// /api/study/heatmap — GitHub 风格 365 天学习热力图
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/study/heatmap?year=2026 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");
  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") ?? new Date().getFullYear().toString(), 10);

  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00Z`);

  const sessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      studyDate: { gte: start.toISOString().slice(0, 10), lt: end.toISOString().slice(0, 10) },
    },
    select: { studyDate: true, durationSec: true, completed: true },
  });

  // 聚合 by date
  const byDate = new Map<string, { minutes: number; completed: number; sessions: number }>();
  for (const s of sessions) {
    const cur = byDate.get(s.studyDate) ?? { minutes: 0, completed: 0, sessions: 0 };
    cur.minutes += Math.round(s.durationSec / 60);
    if (s.completed) cur.completed += 1;
    cur.sessions += 1;
    byDate.set(s.studyDate, cur);
  }

  // 填充全年 365/366 天
  const days = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const key = cursor.toISOString().slice(0, 10);
    const v = byDate.get(key);
    days.push({
      date: key,
      minutes: v?.minutes ?? 0,
      completed: v?.completed ?? 0,
      sessions: v?.sessions ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // 总览
  const totalMinutes = days.reduce((s, d) => s + d.minutes, 0);
  const totalDays = days.filter((d) => d.minutes > 0).length;
  const longestStreak = computeStreak(days);
  const currentStreak = computeCurrentStreak(days);

  return ok({ year, days, totalMinutes, totalDays, longestStreak, currentStreak });
}

function computeStreak(days: { minutes: number }[]): number {
  let max = 0;
  let cur = 0;
  for (const d of days) {
    if (d.minutes > 0) {
      cur += 1;
      if (cur > max) max = cur;
    } else {
      cur = 0;
    }
  }
  return max;
}

function computeCurrentStreak(days: { minutes: number; date: string }[]): number {
  // 从今天往前数连续学习天数
  let cur = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date > today) continue;
    if (days[i].minutes > 0) cur += 1;
    else break;
  }
  return cur;
}
