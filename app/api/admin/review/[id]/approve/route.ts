/** admin 通过单个审核项 (proposal 或 submission) */
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

  if (kind === "proposal") {
    // proposal 标记为 approved (待 admin 手动 merge)
    const p = await prisma.contentProposal.update({
      where: { id: params.id },
      data: { status: "approved" },
    });
    return NextResponse.json({ ok: true, data: { proposal: p } });
  }

  if (kind === "submission") {
    // 标记 reviewed, score 保留
    const s = await prisma.submission.update({
      where: { id: params.id },
      data: { status: "reviewed", gradedAt: new Date() },
    });
    return NextResponse.json({ ok: true, data: { submission: s } });
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 400 });
}
