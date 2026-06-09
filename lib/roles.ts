// 角色权限 — 纯函数 (client-safe)
// 不依赖 next/headers / prisma, 可以在客户端组件里 import

export type Role = "user" | "admin" | "superadmin";

export const ROLES: Role[] = ["user", "admin", "superadmin"];

export function isValidRole(r: string): r is Role {
  return ROLES.includes(r as Role);
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "superadmin";
}
