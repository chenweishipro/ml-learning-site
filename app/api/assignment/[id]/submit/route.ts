/** 提交作业 — 自动评分 */
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitBody {
  content: string;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");

  const body = await readJson<SubmitBody>(req);
  if (!body?.content?.trim()) return fail("作业内容不能为空", 400);

  const assignment = await prisma.assignment.findUnique({ where: { id: params.id } });
  if (!assignment) return fail("作业不存在", 404);

  // 检查截止日期
  if (assignment.dueDate && new Date() > assignment.dueDate) {
    return fail("已过截止日期", 400, "OVERDUE");
  }

  // 自动评分 (基于关键词)
  let score: number | null = null;
  let status = "submitted";
  let matchDetail: string | null = null;

  try {
    const keywords: string[] = JSON.parse(assignment.keywords);
    if (keywords.length > 0) {
      const text = body.content.toLowerCase();
      const hits = keywords.filter((k) => text.includes(k.toLowerCase()));
      const hitRate = hits.length / keywords.length;
      // 60% 命中算及格 (60 分), 全中 100 分
      score = Math.round(hitRate * 100);
      matchDetail = JSON.stringify({
        total: keywords.length,
        hits,
        missed: keywords.filter((k) => !hits.includes(k)),
        hitRate: Math.round(hitRate * 100) + "%",
      });
      status = "auto-graded";
    }
  } catch (e) {
    // 解析失败, 走人工
  }

  const submission = await prisma.submission.upsert({
    where: { assignmentId_userId: { assignmentId: params.id, userId: user.id } },
    create: {
      assignmentId: params.id,
      userId: user.id,
      content: body.content.trim(),
      score,
      status,
      matchDetail,
      gradedAt: score !== null ? new Date() : null,
    },
    update: {
      content: body.content.trim(),
      score,
      status,
      matchDetail,
      gradedAt: score !== null ? new Date() : null,
    },
  });

  return ok({ submission });
}
