// 回答问题
import { getCurrentUser } from "@/lib/auth";
import { createAnswer } from "@/lib/qa";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const body = await readJson<{ body?: string }>(req);
  if (!body || !body.body) return fail("缺少 body", 400);
  const result = await createAnswer({
    questionId: params.id,
    authorId: viewer.id,
    body: body.body,
  });
  if (!result.ok) return fail(result.error, 400);

  // 通知提问者
  try {
    const { createNotification } = await import("@/lib/notifications");
    const { prisma } = await import("@/lib/db");
    const q = await prisma.question.findUnique({ where: { id: params.id } });
    if (q && q.authorId !== viewer.id) {
      await createNotification({
        recipientId: q.authorId,
        type: "system",
        title: "💬 你的问题有新回答",
        body: `${viewer.displayName || viewer.email} 回答了你的问题《${q.title}》`,
        link: `/qa/${params.id}/`,
        meta: { questionId: params.id },
      });
    }
  } catch (e) {
    // ignore
  }

  return ok({ answer: result.data });
}
