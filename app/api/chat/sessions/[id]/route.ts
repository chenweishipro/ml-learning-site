import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSession, deleteSession, renameSession } from "@/lib/chat-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/chat/sessions/:id — 拿单 session 跟全部消息 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  const session = await getSession(user.id, params.id);
  if (!session) return NextResponse.json({ ok: false, error: "不存在" }, { status: 404 });
  return NextResponse.json({ ok: true, data: session });
}

/** PATCH /api/chat/sessions/:id — 改标题 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  if (!body.title) return NextResponse.json({ ok: false, error: "title 必填" }, { status: 400 });
  await renameSession(user.id, params.id, body.title);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/chat/sessions/:id */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  await deleteSession(user.id, params.id);
  return NextResponse.json({ ok: true });
}
