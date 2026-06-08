import { prisma } from "@/lib/db";
import { hashPassword, hashResetToken, passwordIssues, signSession, setSessionCookie } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readJson<{ token?: string; password?: string }>(req);
  if (!body) return fail("请求格式错误", 400);

  const rawToken = (body.token ?? "").trim();
  const password = body.password ?? "";

  if (!rawToken) return fail("缺少重置 token", 400, "MISSING_TOKEN");
  const issues = passwordIssues(password);
  if (issues.length > 0) return fail("密码强度不足: " + issues.join("; "), 400, "WEAK_PASSWORD");

  const tokenHash = hashResetToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("重置链接无效或已过期, 请重新申请", 400, "INVALID_TOKEN");
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // 一次性作废该用户其他未使用的 token
  await prisma.passwordResetToken.updateMany({
    where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    data: { usedAt: new Date() },
  });

  // 直接登录:签发新 session
  const token = await signSession({ sub: record.user.id, email: record.user.email });
  await setSessionCookie(token);

  return ok({
    user: {
      id: record.user.id,
      email: record.user.email,
      displayName: record.user.displayName,
      createdAt: record.user.createdAt,
    },
  });
}
