import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { awardEligibleBadges } from "@/lib/award-badges";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const newly = await awardEligibleBadges(user.id);
  return NextResponse.json({ awarded: newly, count: newly.length });
}
