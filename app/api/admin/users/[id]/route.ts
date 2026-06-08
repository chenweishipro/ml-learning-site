// 超级管理员: 修改用户角色 / 删除用户
import { requireSuperAdmin, isValidRole } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

// 改角色
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const body = await readJson<{ role?: string }>(req);
  if (!body || !body.role) return fail("缺少 role 字段", 400);
  if (!isValidRole(body.role)) return fail("role 必须是 user/admin/superadmin", 400);

  // 不能改自己的角色(防止超级管理员自杀)
  if (params.id === auth.user.id && body.role !== "superadmin") {
    return fail("不能修改自己的角色, 请让其他超级管理员操作", 400, "SELF_DEMOTE_FORBIDDEN");
  }

  // 至少保留一个 superadmin
  if (body.role !== "superadmin") {
    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
    if (target?.role === "superadmin") {
      const otherSupers = await prisma.user.count({
        where: { role: "superadmin", NOT: { id: params.id } },
      });
      if (otherSupers === 0) {
        return fail("系统至少需要 1 个超级管理员, 无法降级", 400, "LAST_SUPERADMIN");
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: body.role },
    select: { id: true, email: true, role: true },
  });

  return ok({ user: updated });
}

// 删除用户(谨慎操作,清空其进度/编辑日志)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  if (params.id === auth.user.id) {
    return fail("不能删除自己的账号", 400, "SELF_DELETE_FORBIDDEN");
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true, email: true } });
  if (!target) return fail("用户不存在", 404);

  if (target.role === "superadmin") {
    const otherSupers = await prisma.user.count({
      where: { role: "superadmin", NOT: { id: params.id } },
    });
    if (otherSupers === 0) {
      return fail("系统至少需要 1 个超级管理员, 无法删除", 400, "LAST_SUPERADMIN");
    }
  }

  await prisma.user.delete({ where: { id: params.id } });
  return ok({ deleted: { id: params.id, email: target.email } });
}
