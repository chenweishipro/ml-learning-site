/** Admin: 测试推送 / 给指定用户推送 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { sendNotification } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  // 仅管理员可向所有用户推送, 登录用户可向自己推送测试
  const body = await req.json().catch(() => ({}));
  const { userId, title, body: msgBody, url, tag } = body || {};
  const targetId = userId ?? user.id;

  if (userId && userId !== user.id && !isAdmin(user.role)) {
    return NextResponse.json({ ok: false, error: "无权向其他用户发送" }, { status: 403 });
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: targetId },
  });
  if (!subs.length) {
    return NextResponse.json({ ok: false, error: "该用户没有推送订阅" }, { status: 404 });
  }

  const results: any[] = [];
  for (const s of subs) {
    const res = await sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      {
        title: title || "ML 学习站",
        body: msgBody || "有新内容上线, 打开看看吧!",
        url: url || "/",
        tag: tag || "ml-site-test",
        requireInteraction: false,
      }
    );
    results.push({ id: s.id, endpoint: s.endpoint.slice(-30), ...res });
    // 失效订阅自动清理
    if (res.statusCode === 404 || res.statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => undefined);
    }
  }

  return NextResponse.json({ ok: true, sent: results.filter((r) => r.ok).length, total: subs.length, results });
}