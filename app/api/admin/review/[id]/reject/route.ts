/** admin 拒绝单个审核项 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "proposal";
  const reason = url.searchParams.get("reason") ?? "";

  if (kind === "proposal") {
    const p = await prisma.contentProposal.update({
      where: { id: params.id },
      data: { status: "rejected" },
    });
    return NextResponse.json({ ok: true, data: { proposal: p } });
  }

  if (kind === "submission") {
    const s = await prisma.submission.update({
      where: { id: params.id },
      data: { status: "reviewed", score: 0, feedback: reason || "未通过, 请重新提交", gradedAt: new Date() },
    });
    return NextResponse.json({ ok: true, data: { submission: s } });
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 400 });
}
