/** 邀请码 — 生成 / 列表 / 兑换 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PostBody = { action: "generate" } | { action: "redeem"; code: string };
function parsePostBody(body: any): PostBody | null {
  if (!body || typeof body !== "object") return null;
  if (body.action === "generate") return { action: "generate" };
  if (body.action === "redeem" && typeof body.code === "string" && body.code.length >= 4 && body.code.length <= 40) return { action: "redeem", code: body.code };
  return null;
}

function genCode() {
  // 8 位大写 base32
  return crypto.randomBytes(5).toString("base64").replace(/[+/=]/g, "").slice(0, 8).toUpperCase();
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const codes = await prisma.inviteCode.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  // 加统计
  const used = codes.filter((c) => c.usedById).length;
  return NextResponse.json({
    codes: codes.map((c) => ({
      code: c.code,
      used: !!c.usedById,
      createdAt: c.createdAt.toISOString(),
      usedAt: c.usedAt?.toISOString() ?? null,
    })),
    total: codes.length,
    used,
    remaining: codes.length - used,
    maxPerUser: 10,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = parsePostBody(body);
  if (!parsed) return NextResponse.json({ error: "bad request" }, { status: 400 });

  if (parsed.action === "generate") {
    const existing = await prisma.inviteCode.count({ where: { ownerId: user.id } });
    if (existing >= 10) return NextResponse.json({ error: "已达上限 (10 个)" }, { status: 400 });
    const code = genCode();
    await prisma.inviteCode.create({
      data: { code, ownerId: user.id },
    });
    return NextResponse.json({ code });
  }

  if (parsed.action === "redeem") {
    // 在 register 时已 redeem, 此处仅返回 200 (no-op)
    return NextResponse.json({ ok: true });
  }
}
