/** GET 单个作业详情 */
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, displayName: true, email: true } },
      _count: { select: { submissions: true } },
    },
  });
  if (!assignment) return fail("作业不存在", 404, "NOT_FOUND");

  const mySubmission = user
    ? await prisma.submission.findUnique({
        where: { assignmentId_userId: { assignmentId: params.id, userId: user.id } },
      })
    : null;

  return ok({ assignment, mySubmission });
}
