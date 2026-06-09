// 采纳答案
import { getCurrentUser } from "@/lib/auth";
import { acceptAnswer } from "@/lib/qa";
import { isAdmin } from "@/lib/roles";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const body = await readJson<{ questionId?: string }>(req);
  if (!body || !body.questionId) return fail("缺少 questionId", 400);
  const result = await acceptAnswer({
    questionId: body.questionId,
    answerId: params.id,
    userId: viewer.id,
    isAdmin: isAdmin(viewer.role),
  });
  if (!result.ok) return fail(result.error, 400);
  return ok({ accepted: true });
}
