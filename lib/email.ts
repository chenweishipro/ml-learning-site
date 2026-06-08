// SMTP 邮件发送 — 主要用来发重置密码邮件
import nodemailer, { type Transporter } from "nodemailer";

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || pass === "placeholder") {
    return null; // SMTP 未配置
  }
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });
  return cachedTransport;
}

export function isEmailConfigured(): boolean {
  return getTransport() !== null;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransport();
  if (!transport) {
    return { ok: false, error: "SMTP 未配置" };
  }
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com";
  try {
    await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function renderResetEmail(opts: {
  displayName: string | null;
  email: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } {
  const greeting = opts.displayName ? `${opts.displayName}, 您好!` : "您好!";
  const subject = "重置你的 ML 学习站密码";
  const text = [
    greeting,
    "",
    "我们收到了你 ( " + opts.email + " ) 的密码重置请求。",
    "点击下方链接在 " + opts.expiresInMinutes + " 分钟内重置密码:",
    opts.resetUrl,
    "",
    "如果不是你本人的操作, 请忽略这封邮件。",
    "— ML 学习站",
  ].join("\n");
  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#171717">
  <h2 style="margin:0 0 16px;font-size:20px">${greeting}</h2>
  <p style="line-height:1.6;color:#404040">
    我们收到了你 (<strong>${opts.email}</strong>) 的密码重置请求。
  </p>
  <p style="line-height:1.6;color:#404040">
    点击下方按钮, 在 <strong>${opts.expiresInMinutes} 分钟</strong>内重置你的密码:
  </p>
  <p style="margin:24px 0">
    <a href="${opts.resetUrl}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:500">
      重置密码
    </a>
  </p>
  <p style="line-height:1.6;color:#737373;font-size:13px">
    如果按钮无法点击, 请复制下方链接到浏览器:
    <br><span style="word-break:break-all;color:#525252">${opts.resetUrl}</span>
  </p>
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
  <p style="color:#a3a3a3;font-size:12px;line-height:1.5">
    如果不是你本人的操作, 请忽略这封邮件, 你的账号仍然安全。
  </p>
</div>`.trim();
  return { subject, html, text };
}
