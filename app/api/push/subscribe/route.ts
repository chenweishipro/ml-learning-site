/** Push 订阅注册 / 注销 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getVapidPublicKey } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // 返回 VAPID 公钥 (前端用于订阅)
  try {
    return NextResponse.json({ ok: true, publicKey: getVapidPublicKey() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "init_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ ok: false, error: "订阅数据不完整" }, { status: 400 });
  }

  try {
    // upsert: 同 endpoint 替换 userAgent / userId
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        userId: user.id,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: req.headers.get("user-agent") || "",
      },
      create: {
        userId: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: req.headers.get("user-agent") || "",
      },
    });
    return NextResponse.json({ ok: true, id: sub.id });
  } catch (e: any) {
    // 表不存在 → 自动迁移 schema
    if (e?.message?.includes("does not exist") || e?.code === "P2021") {
      return NextResponse.json(
        { ok: false, error: "PushSubscription 表不存在, 请先执行 prisma db push" },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.endpoint) return NextResponse.json({ ok: false, error: "缺少 endpoint" }, { status: 400 });

  try {
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint: body.endpoint },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}