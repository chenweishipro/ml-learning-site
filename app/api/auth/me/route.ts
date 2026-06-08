import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isSuperAdmin, getSuperAdminEmails } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null, role: null, isAdmin: false, isSuperAdmin: false });

  // 自动同步: env 里列出的邮箱一律设为 superadmin
  const superEmails = getSuperAdminEmails();
  if (superEmails.includes(user.email.toLowerCase()) && user.role !== "superadmin") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "superadmin" },
    });
    user.role = "superadmin";
  }

  return ok({
    user,
    role: user.role,
    isAdmin: isAdmin(user.role),
    isSuperAdmin: isSuperAdmin(user.role),
  });
}
