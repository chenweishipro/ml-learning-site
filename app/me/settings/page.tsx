import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsClient } from "./SettingsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "账号设置 · ML 学习站",
  description: "邮件简报、隐私、通知偏好",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/");

  const sub = await prisma.newsletterSubscription.findUnique({ where: { userId: user.id } });
  const initial = sub ? {
    enabled: sub.enabled,
    frequency: sub.frequency as "weekly" | "monthly",
    topics: JSON.parse(sub.topics) as string[],
    lastSentAt: sub.lastSentAt?.toISOString() ?? null,
  } : { enabled: false, frequency: "weekly" as const, topics: ["new_chapters"] as string[], lastSentAt: null };

  return <SettingsClient initial={initial} />;
}
