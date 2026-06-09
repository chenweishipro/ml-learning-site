// 点赞/取消点赞
import { getCurrentUser } from "@/lib/auth";
import { voteAnswer } from "@/lib/qa";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const result = await voteAnswer({ answerId: params.id, userId: viewer.id });
  if (!result.ok) return fail(result.error, 400);
  return ok(result.data);
}
