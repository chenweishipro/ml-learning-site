// 管理员鉴权 + 写日志
import { getCurrentUser } from "./auth";
import { prisma } from "./db";

/** 管理员邮箱白名单(逗号分隔,环境变量优先) */
function getAdminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS;
  if (fromEnv) {
    return fromEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  // 默认: 部署时初始化用的邮箱
  return ["15000568198@163.com", "15000568198@local.test"];
}

export async function isAdmin(userEmail: string | null | undefined): Promise<boolean> {
  if (!userEmail) return false;
  return getAdminEmails().includes(userEmail.toLowerCase());
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "未登录" };
  }
  if (!(await isAdmin(user.email))) {
    return { ok: false as const, status: 403, error: "需要管理员权限" };
  }
  return { ok: true as const, user };
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
