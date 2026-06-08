import { prisma } from "@/lib/db";
import { generateResetToken, isValidEmail, RESET_TTL_SECONDS } from "@/lib/auth";
import { isEmailConfigured, renderResetEmail, sendEmail } from "@/lib/email";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readJson<{ email?: string }>(req);
  if (!body) return fail("请求格式错误", 400);

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return fail("邮箱格式不正确", 400, "INVALID_EMAIL");
  }

  // 邮件未配置:直接告诉用户
  if (!isEmailConfigured()) {
    return fail(
      "邮件服务尚未配置, 请联系管理员或在控制台查看错误日志",
      503,
      "SMTP_NOT_CONFIGURED",
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // 安全:无论用户是否存在, 都返回相同响应, 避免泄露邮箱是否注册
  if (user) {
    const { raw, hash } = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TTL_SECONDS * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(raw)}`;

    const rendered = renderResetEmail({
      displayName: user.displayName,
      email: user.email,
      resetUrl,
      expiresInMinutes: Math.floor(RESET_TTL_SECONDS / 60),
    });

    const sent = await sendEmail({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    if (!sent.ok) {
      console.error("Failed to send reset email:", sent.error);
      return fail("邮件发送失败, 请稍后再试", 500, "EMAIL_SEND_FAILED");
    }
  }

  return ok({ sent: true });
}
