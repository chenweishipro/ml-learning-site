import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BADGES, TIER_META, type BadgeState } from "@/lib/badges";
import { computeBadgeState } from "@/lib/award-badges";
import { Award, Lock, Sparkles, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementsClient } from "./AchievementsClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/");

  const [earned, state] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: "desc" },
    }),
    computeBadgeState(user.id),
  ]);

  return (
    <AchievementsClient
      earned={earned.map((e) => ({ id: e.badgeId, context: e.context ?? undefined, earnedAt: e.earnedAt.toISOString() }))}
      state={state as unknown as BadgeState}
    />
  );
}
