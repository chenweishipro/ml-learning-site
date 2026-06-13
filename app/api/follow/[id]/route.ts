import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/follow/[id] -> { following: boolean, followers: number }
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ following: false, followers: 0 }, { status: 401 });
  if (me.id === params.id) {
    return NextResponse.json({ following: false, followers: 0, self: true });
  }
  const [row, count] = await Promise.all([
    prisma.userFollow.findUnique({ where: { followerId_followeeId: { followerId: me.id, followeeId: params.id } } }).catch(() => null),
    prisma.userFollow.count({ where: { followeeId: params.id } }),
  ]);
  return NextResponse.json({ following: !!row, followers: count });
}

// POST /api/follow/[id] -> 关注
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (me.id === params.id) {
    return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
  }
  await prisma.userFollow.upsert({
    where: { followerId_followeeId: { followerId: me.id, followeeId: params.id } },
    create: { followerId: me.id, followeeId: params.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/follow/[id] -> 取消关注
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.userFollow.deleteMany({
    where: { followerId: me.id, followeeId: params.id },
  });
  return NextResponse.json({ ok: true });
}
