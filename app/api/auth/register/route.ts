import { prisma } from "@/lib/db";
import { hashPassword, isValidEmail, passwordIssues, signSession, setSessionCookie } from "@/lib/auth";
import { isAdmin, isSuperAdmin, getSuperAdminEmails } from "@/lib/admin";
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
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });

  // 注册用户默认为 'user' 角色
  // 但如果 email 在 SUPER_ADMIN_EMAILS 里 (部署邮箱预置), 提升为 superadmin
  const superEmails = getSuperAdminEmails();
  if (superEmails.includes(user.email.toLowerCase())) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "superadmin" },
    });
    user.role = "superadmin";
  }

  const token = await signSession({ sub: user.id, email: user.email });
  await setSessionCookie(token);

  return ok({
    user,
    role: user.role,
    isAdmin: isAdmin(user.role),
    isSuperAdmin: isSuperAdmin(user.role),
  });
}
