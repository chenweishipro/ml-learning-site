// 标记单条已读
import { getCurrentUser } from "@/lib/auth";
import { markRead } from "@/lib/notifications";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const result = await markRead({ id: params.id, userId: viewer.id });
  return ok({ updated: result.count });
}
