// 超级管理员: 列出所有用户
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { contentEdits: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  // 同时返回每个用户的 progress 数量(更直观的活跃度)
  const withProgress = await Promise.all(
    users.map(async (u) => {
      const completed = await prisma.chapterProgress.count({
        where: { userId: u.id, completed: true },
      });
      return { ...u, completedChapters: completed };
    })
  );

  return ok({ users: withProgress });
}
