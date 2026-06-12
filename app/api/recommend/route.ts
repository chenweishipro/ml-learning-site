import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recommendNext } from "@/lib/recommend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/recommend — 学习路径推荐 (登录后) */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "5", 10) || 5, 10);
  const recs = await recommendNext(user.id, { limit });
  return NextResponse.json({ ok: true, data: recs });
}
