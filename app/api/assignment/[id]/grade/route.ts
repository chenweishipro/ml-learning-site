/** admin 评分 / 反馈 */
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return fail("需要管理员权限", 403, "FORBIDDEN");

  const body = await readJson<{ submissionId: string; score: number; feedback: string }>(req);
  if (!body?.submissionId || typeof body.score !== "number") {
    return fail("请求格式错误", 400);
  }
  if (body.score < 0 || body.score > 100) return fail("分数必须在 0-100 之间", 400);

  const submission = await prisma.submission.update({
    where: { id: body.submissionId },
    data: {
      score: body.score,
      feedback: body.feedback ?? "",
      status: "reviewed",
      gradedAt: new Date(),
    },
  });

  return ok({ submission });
}
