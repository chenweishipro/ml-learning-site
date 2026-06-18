import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InviteClient } from "./InviteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "邀请码 · ML 学习站",
  description: "生成邀请码分享给朋友, 双方均可获得专属徽章",
};

export default async function InvitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/");

  const codes = await prisma.inviteCode.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const invitees = await prisma.user.findMany({
    where: {
      redeemedInvite: {
        some: { ownerId: user.id },
      },
    },
    select: { id: true, displayName: true, email: true, createdAt: true, avatarUrl: true, bio: true },
    take: 30,
  });
  // 取得 invitee 们的 inviteCode usedAt
  const usedCodes = await prisma.inviteCode.findMany({
    where: { ownerId: user.id, usedById: { not: null } },
    orderBy: { usedAt: "desc" },
    take: 30,
    select: { usedById: true, usedAt: true, code: true },
  });
  const inviteeMap = new Map(usedCodes.map((c) => [c.usedById!, c]));

  return (
    <InviteClient
      initialCodes={codes.map((c) => ({
        code: c.code,
        used: !!c.usedById,
        createdAt: c.createdAt.toISOString(),
        usedAt: c.usedAt?.toISOString() ?? null,
      }))}
      invitees={invitees.map((u) => ({
        id: u.id,
        displayName: u.displayName || u.email,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        joinedAt: u.createdAt.toISOString(),
        invitedAt: inviteeMap.get(u.id)?.usedAt?.toISOString() ?? u.createdAt.toISOString(),
      }))}
    />
  );
}
