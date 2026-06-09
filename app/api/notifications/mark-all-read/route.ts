// 全部标记已读
import { getCurrentUser } from "@/lib/auth";
import { markAllRead } from "@/lib/notifications";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const result = await markAllRead(viewer.id);
  return ok({ updated: result.count });
}
