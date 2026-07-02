import { prisma } from "@/lib/db";
import { hashPassword, isValidEmail, passwordIssues, signSession, setSessionCookie } from "@/lib/auth";
import { isAdmin, isSuperAdmin, getSuperAdminEmails } from "@/lib/admin";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readJson<{ email?: string; password?: string; displayName?: string; inviteCode?: string }>(req);
  if (!body) return fail("请求格式错误", 400);

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const displayName = (body.displayName ?? "").trim() || null;
  const inviteCode = (body.inviteCode ?? "").trim().toUpperCase() || null;

  if (!email || !isValidEmail(email)) return fail("邮箱格式不正确", 400, "INVALID_EMAIL");
  const issues = passwordIssues(password);
  if (issues.length > 0) return fail("密码强度不足: " + issues.join("; "), 400, "WEAK_PASSWORD");

  // 校验邀请码 (如果填了)
  let inviteRecord: { id: string; code: string; ownerId: string } | null = null;
  if (inviteCode) {
    const found = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!found) return fail("邀请码不存在", 400, "BAD_INVITE");
    if (found.usedById) return fail("邀请码已被使用", 400, "INVITE_USED");
    inviteRecord = { id: found.id, code: found.code, ownerId: found.ownerId };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("该邮箱已注册, 请直接登录", 409, "EMAIL_TAKEN");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true, onboardingStep: true, onboardingDoneAt: true },
  });

  // 兑换邀请码 (双方都得徽章)
  if (inviteRecord) {
    await prisma.inviteCode.update({
      where: { id: inviteRecord.id },
      data: { usedById: user.id, usedAt: new Date() },
    });
    // 给新用户发 "新种子" 徽章
    try {
      await prisma.userBadge.create({
        data: { userId: user.id, badgeId: "invited", context: JSON.stringify({ invitedBy: inviteRecord.ownerId }) },
      });
    } catch {}
    // 给邀请者发 "推广者" 徽章 (每次邀请, 累计 3/10/30 不同等级)
    try {
      const inviteeCount = await prisma.inviteCode.count({ where: { ownerId: inviteRecord.ownerId, usedById: { not: null } } });
      let badgeId = "promoter-3"; // 默认发最低级
      if (inviteeCount >= 30) badgeId = "promoter-30";
      else if (inviteeCount >= 10) badgeId = "promoter-10";
      else if (inviteeCount >= 3) badgeId = "promoter-3";
      await prisma.userBadge.create({
        data: { userId: inviteRecord.ownerId, badgeId, context: JSON.stringify({ invitee: user.id, total: inviteeCount }) },
      });
    } catch {}
  }

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
    invitedBy: inviteRecord?.ownerId ?? null,
  });
}
