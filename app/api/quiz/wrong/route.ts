import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

/** POST /api/quiz/wrong — 提交错题
 *  body: { courseSlug, chapterSlug, wrongItems: [{ questionIndex, userAnswer, correctAnswer }] }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");
  const body = await readJson<{
    courseSlug: string;
    chapterSlug: string;
    wrongItems: Array<{ questionIndex: number; userAnswer: number; correctAnswer: number }>;
  }>(req);
  if (!body?.courseSlug || !body?.chapterSlug) return fail("请求格式错误", 400);
  if (!Array.isArray(body.wrongItems)) return fail("wrongItems 必须是数组", 400);

  for (const item of body.wrongItems) {
    if (
      typeof item.questionIndex !== "number" ||
      typeof item.userAnswer !== "number" ||
      typeof item.correctAnswer !== "number"
    )
      continue;
    await prisma.quizWrong.upsert({
      where: {
        userId_courseSlug_chapterSlug_questionIndex: {
          userId: user.id,
          courseSlug: body.courseSlug,
          chapterSlug: body.chapterSlug,
          questionIndex: item.questionIndex,
        },
      },
      create: {
        userId: user.id,
        courseSlug: body.courseSlug,
        chapterSlug: body.chapterSlug,
        questionIndex: item.questionIndex,
        userAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        resolved: false,
      },
      update: {
        userAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        resolved: false,
        updatedAt: new Date(),
      },
    });
  }
  return ok({ saved: body.wrongItems.length });
}

/** GET /api/quiz/wrong — 拿用户所有错题
 *  query: ?resolved=false&limit=50
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");
  const url = new URL(req.url);
  const resolvedParam = url.searchParams.get("resolved");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 200);
  const items = await prisma.quizWrong.findMany({
    where: {
      userId: user.id,
      ...(resolvedParam === "false" ? { resolved: false } : {}),
      ...(resolvedParam === "true" ? { resolved: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return ok({ items });
}

/** DELETE /api/quiz/wrong — 标记错题为已解决 (resolved=true)
 *  body: { ids: string[] } | { all: true }
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");
  const body = (await readJson<{ ids?: string[]; all?: boolean }>(req).catch(() => ({}))) as { ids?: string[]; all?: boolean };
  if (body.all) {
    const r = await prisma.quizWrong.updateMany({
      where: { userId: user.id, resolved: false },
      data: { resolved: true },
    });
    return ok({ updated: r.count });
  }
  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const r = await prisma.quizWrong.updateMany({
      where: { userId: user.id, id: { in: body.ids } },
      data: { resolved: true },
    });
    return ok({ updated: r.count });
  }
  return fail("请提供 ids 或 all=true", 400);
}
