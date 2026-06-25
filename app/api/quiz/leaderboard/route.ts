/** Quiz 排行榜 — 章节最高分 */
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const courseSlug = url.searchParams.get("courseSlug");
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "10")));

  // 章节排行: 各章节最佳得分
  const chapterBest = await prisma.quizAttempt.groupBy({
    by: ["courseSlug", "chapterSlug"],
    where: courseSlug ? { courseSlug } : {},
    _max: { score: true },
    _count: { id: true },
    _avg: { score: true },
  });

  // 全站总排行: 用户总分汇总
  const userTotals = await prisma.quizAttempt.groupBy({
    by: ["userId"],
    _count: { id: true },
    _avg: { score: true },
    orderBy: { _avg: { score: "desc" } },
    take: limit,
  });

  // 取 user 信息
  const userIds = userTotals.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // 章节排行 (按 avg score 降序)
  const chapterRank = chapterBest
    .sort((a, b) => (b._max.score ?? 0) - (a._max.score ?? 0))
    .slice(0, limit)
    .map((c) => ({
      courseSlug: c.courseSlug,
      chapterSlug: c.chapterSlug,
      bestScore: c._max.score ?? 0,
      avgScore: Math.round(c._avg.score ?? 0),
      attempts: c._count.id,
    }));

  const userRank = userTotals.map((u) => {
    const info = userMap.get(u.userId);
    return {
      userId: u.userId,
      displayName: info?.displayName ?? null,
      email: info?.email ?? null,
      avgScore: Math.round(u._avg.score ?? 0),
      attempts: u._count.id,
    };
  });

  return ok({ chapterRank, userRank });
}
