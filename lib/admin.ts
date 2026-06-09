// 角色权限 — Server 端
// 纯函数 (isAdmin / isSuperAdmin / isValidRole) 都在 lib/roles.ts 里, client-safe
// 这个文件保留 server-only 的部分: 启动时同步, logEdit, 鉴权守卫

import { prisma } from "./db";
import { getCurrentUser } from "./auth";

// 重新导出, 兼容旧 import
import { isAdmin, isSuperAdmin, type Role } from "./roles";
export { ROLES, isValidRole, isAdmin, isSuperAdmin } from "./roles";
export type { Role } from "./roles";

/** 从 env 读 superadmin 邮箱白名单, 用于首次部署时初始化 */
export function getSuperAdminEmails(): string[] {
  const fromEnv = process.env.SUPER_ADMIN_EMAILS;
  if (fromEnv) {
    return fromEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

/**
 * 启动时调用: 把 SUPER_ADMIN_EMAILS 列表里的用户提升到 superadmin
 * (不会降级已经存在的 superadmin)
 */
export async function syncSuperAdminsFromEnv(): Promise<{ promoted: number }> {
  const emails = getSuperAdminEmails();
  if (emails.length === 0) return { promoted: 0 };
  const result = await prisma.user.updateMany({
    where: { email: { in: emails }, NOT: { role: "superadmin" } },
    data: { role: "superadmin" },
  });
  return { promoted: result.count };
}

/** 同步页面用的鉴权: 从 cookies 拿 user, 检查 role */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, status: 401, error: "未登录" };
  if (!isAdmin(user.role)) {
    return { ok: false as const, status: 403, error: "需要管理员权限" };
  }
  return { ok: true as const, user };
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, status: 401, error: "未登录" };
  if (!isSuperAdmin(user.role)) {
    return { ok: false as const, status: 403, error: "需要超级管理员权限" };
  }
  return { ok: true as const, user };
}

/** 仅判断当前请求是否来自 superadmin (供前端用) */
export async function getCurrentRole(): Promise<Role | null> {
  const u = await getCurrentUser();
  return (u?.role as Role | undefined) ?? null;
}

export async function logEdit(opts: {
  userId: string;
  scope: "course" | "chapter";
  courseSlug: string;
  chapterSlug?: string;
  courseRefId?: string;
  chapterRefId?: string;
  action: "save" | "delete";
  summary?: string;
}) {
  await prisma.contentEditLog.create({
    data: {
      userId: opts.userId,
      scope: opts.scope,
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug,
      courseRefId: opts.courseRefId,
      chapterRefId: opts.chapterRefId,
      action: opts.action,
      summary: opts.summary?.slice(0, 200),
    },
  });
}
