/** QuizAttempt API — POST 提交尝试, GET 查询历史 */
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AttemptBody {
  courseSlug: string;
  chapterSlug: string;
  totalCorrect: number;
  totalQuestions: number;
  timeSpent?: number; // 秒
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");
  const body = await readJson<AttemptBody>(req);
  if (!body?.courseSlug || !body?.chapterSlug) return fail("请求格式错误", 400);
  if (typeof body.totalCorrect !== "number" || typeof body.totalQuestions !== "number") {
    return fail("分数字段无效", 400);
  }
  if (body.totalQuestions <= 0 || body.totalCorrect < 0 || body.totalCorrect > body.totalQuestions) {
    return fail("分数超出范围", 400);
  }
  const score = Math.round((body.totalCorrect / body.totalQuestions) * 100);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      courseSlug: body.courseSlug,
      chapterSlug: body.chapterSlug,
      totalCorrect: body.totalCorrect,
      totalQuestions: body.totalQuestions,
      score,
      timeSpent: body.timeSpent ?? 0,
    },
  });

  return ok({ attempt });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "10")));
  const courseSlug = url.searchParams.get("courseSlug");

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id, ...(courseSlug ? { courseSlug } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // 聚合统计
  const agg = await prisma.quizAttempt.aggregate({
    where: { userId: user.id },
    _count: { id: true },
    _avg: { score: true },
    _sum: { totalCorrect: true, totalQuestions: true },
  });

  return ok({
    attempts,
    stats: {
      totalAttempts: agg._count.id,
      avgScore: Math.round(agg._avg.score ?? 0),
      totalCorrect: agg._sum.totalCorrect ?? 0,
      totalQuestions: agg._sum.totalQuestions ?? 0,
    },
  });
}
