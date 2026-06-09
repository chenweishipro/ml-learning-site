// 通知: 列表 + 未读数
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, countUnread } from "@/lib/notifications";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const onlyUnread = url.searchParams.get("unread") === "1";

  const [notifications, unread] = await Promise.all([
    listNotifications({ userId: viewer.id, limit: Math.min(limit, 200), onlyUnread }),
    countUnread(viewer.id),
  ]);

  return ok({ notifications, unread });
}
