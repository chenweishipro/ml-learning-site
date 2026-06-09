// 超级管理员: 触发用户的密码重置
// - 生成一个新的重置 token
// - 通过邮件发送给该用户
// - 同时返回 reset URL, 方便管理员在邮件失败时手动分享
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { generateResetToken, RESET_TTL_SECONDS } from "@/lib/auth";
import { isEmailConfigured, renderResetEmail, sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, displayName: true },
  });
  if (!target) return fail("用户不存在", 404);

  const { raw, hash } = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_SECONDS * 1000);
  await prisma.passwordResetToken.create({
    data: { userId: target.id, tokenHash: hash, expiresAt },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(raw)}`;

  let emailSent = false;
  let emailError: string | null = null;

  if (isEmailConfigured()) {
    const rendered = renderResetEmail({
      displayName: target.displayName,
      email: target.email,
      resetUrl,
      expiresInMinutes: Math.floor(RESET_TTL_SECONDS / 60),
    });
    const sent = await sendEmail({
      to: target.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    if (sent.ok) {
      emailSent = true;
    } else {
      emailError = sent.error ?? "未知错误";
      console.error("Failed to send reset email (admin-triggered):", sent.error);
    }
  } else {
    emailError = "SMTP 未配置";
  }

  return ok({
    resetUrl,
    expiresAt: expiresAt.toISOString(),
    emailSent,
    emailError,
    expiresInMinutes: Math.floor(RESET_TTL_SECONDS / 60),
  });
}
