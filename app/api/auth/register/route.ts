import { prisma } from "@/lib/db";
import { hashPassword, isValidEmail, passwordIssues, signSession, setSessionCookie } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readJson<{ email?: string; password?: string; displayName?: string }>(req);
  if (!body) return fail("请求格式错误", 400);

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const displayName = (body.displayName ?? "").trim() || null;

  if (!email || !isValidEmail(email)) return fail("邮箱格式不正确", 400, "INVALID_EMAIL");
  const issues = passwordIssues(password);
  if (issues.length > 0) return fail("密码强度不足: " + issues.join("; "), 400, "WEAK_PASSWORD");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("该邮箱已注册, 请直接登录", 409, "EMAIL_TAKEN");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
    select: { id: true, email: true, displayName: true, createdAt: true },
  });

  const token = await signSession({ sub: user.id, email: user.email });
  await setSessionCookie(token);

  return ok({ user });
}
