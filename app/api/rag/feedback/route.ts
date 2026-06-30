/** RAG 回答反馈 (v19.5)
 *  POST /api/rag/feedback/         body: { messageId, rating, comment? }
 *  GET  /api/rag/feedback/?messageId=xxx  拉某条消息的反馈
 *  GET  /api/rag/feedback/         拉当前用户全部反馈 (admin 用)
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST 提交 / 更新反馈 (upsert) */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { messageId, rating, comment } = body || {};

  if (!messageId || typeof messageId !== "string") {
    return NextResponse.json({ ok: false, error: "messageId 必填" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "rating 必须是 1..5 的整数" }, { status: 400 });
  }

  // 验证 message 属于该 user
  const msg = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { userId: true, role: true },
  });
  if (!msg) return NextResponse.json({ ok: false, error: "消息不存在" }, { status: 404 });
  if (msg.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "无权反馈" }, { status: 403 });
  }
  if (msg.role !== "assistant") {
    return NextResponse.json({ ok: false, error: "只能给 AI 回复评分" }, { status: 400 });
  }

  try {
    const fb = await prisma.ragFeedback.upsert({
      where: { messageId },
      create: {
        userId: user.id,
        messageId,
        rating,
        comment: comment ? String(comment).slice(0, 1000) : null,
      },
      update: {
        rating,
        comment: comment ? String(comment).slice(0, 1000) : null,
      },
    });
    return NextResponse.json({ ok: true, id: fb.id, rating: fb.rating });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "保存失败" }, { status: 500 });
  }
}

/** GET 拉反馈 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const messageId = url.searchParams.get("messageId");

  if (messageId) {
    const fb = await prisma.ragFeedback.findUnique({ where: { messageId } });
    if (fb && fb.userId === user.id) {
      return NextResponse.json({ ok: true, feedback: fb });
    }
    return NextResponse.json({ ok: true, feedback: null });
  }

  // 全部反馈 (admin only)
  if (user.role !== "admin" && user.role !== "superadmin") {
    return NextResponse.json({ ok: false, error: "需要管理员权限" }, { status: 403 });
  }

  const list = await prisma.ragFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { message: { select: { content: true, sessionId: true } } },
  });
  return NextResponse.json({
    ok: true,
    feedbacks: list.map((f) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt.toISOString(),
      messagePreview: (f.message.content || "").slice(0, 100),
      sessionId: f.message.sessionId,
    })),
  });
}