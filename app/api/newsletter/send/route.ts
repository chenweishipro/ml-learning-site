/** 邮件简报发送 (admin) */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { sendWeeklyToAll, buildWeeklyContent, renderNewsletter } from "@/lib/newsletter";
import { prisma } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const dryRun = !!body.dryRun;
  const limit = body.limit ?? 100;
  const targetEmail = body.to as string | undefined;

  if (targetEmail) {
    // 单发预览
    const target = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!target) return NextResponse.json({ error: "user not found" }, { status: 404 });
    const content = await buildWeeklyContent();
    const { subject, html, text } = renderNewsletter({
      email: target.email,
      displayName: target.displayName,
      content,
    });
    const { sendNewsletter } = await import("@/lib/newsletter");
    const result = await sendNewsletter({ to: target.email, subject, html, text, userId: target.id });
    return NextResponse.json({ ...result, smtpConfigured: isEmailConfigured() });
  }

  const stats = await sendWeeklyToAll({ dryRun, limit });
  return NextResponse.json({ ...stats, smtpConfigured: isEmailConfigured() });
}
