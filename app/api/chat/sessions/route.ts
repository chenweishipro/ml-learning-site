import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listSessions, createSession } from "@/lib/chat-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/chat/sessions — 拿用户所有 session (按时间倒序) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  const items = await listSessions(user.id);
  return NextResponse.json({ ok: true, data: items });
}

/** POST /api/chat/sessions — 新建 session (body: { title }) */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const session = await createSession(user.id, body.title ?? "新对话");
  return NextResponse.json({ ok: true, data: session });
}
