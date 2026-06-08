// 角色权限模型
//   user        — 默认角色, 仅可浏览
//   admin       — 可编辑课程/章节 (CourseOverride / ChapterOverride)
//   superadmin  — 全部 admin 权限 + 可改其他用户角色
//
// 角色字符串直接存 User.role (String 字段, 默认 "user")。
// 第一次启动时, 由 SUPER_ADMIN_EMAILS 环境变量指定的邮箱会被自动提升为 superadmin。

import { prisma } from "./db";
import { getCurrentUser } from "./auth";

export type Role = "user" | "admin" | "superadmin";

export const ROLES: Role[] = ["user", "admin", "superadmin"];

export function isValidRole(r: string): r is Role {
  return ROLES.includes(r as Role);
}

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

export function isAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "superadmin";
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
