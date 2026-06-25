/** 拉作业的所有提交 (admin) */
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return fail("需要管理员权限", 403, "FORBIDDEN");

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: params.id },
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { id: true, displayName: true, email: true } },
    },
  });
  return ok({ submissions });
}
