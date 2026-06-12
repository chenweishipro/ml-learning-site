// 提交编程题结果 — 跟 quiz 错题一样存, 但记录 passed 跟代码
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

interface CodingSubmissionInput {
  challengeId: string;
  code: string;
  passed: boolean;
  passedTests: number;
  totalTests: number;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");
  const body = await readJson<CodingSubmissionInput>(req);
  if (!body?.challengeId) return fail("缺少 challengeId", 400);

  // 解析 challengeId → courseSlug/chapterSlug
  const [courseSlug, chapterSlug, ...rest] = body.challengeId.split("/");
  if (!courseSlug || !chapterSlug) return fail("challengeId 格式错误", 400);

  // 我们用 QuizWrong 表复用 (challengeId 存为 questionIndex -1 标记 "is coding")
  // 或者新建表 — 简单起见: 新建 CodingSubmission
  try {
    const sub = await prisma.codingSubmission.create({
      data: {
        userId: user.id,
        courseSlug,
        chapterSlug,
        challengeId: body.challengeId,
        code: body.code ?? "",
        passed: body.passed ?? false,
        passedTests: body.passedTests ?? 0,
        totalTests: body.totalTests ?? 0,
      },
    });
    return ok({ id: sub.id, saved: true });
  } catch (e: any) {
    return fail(e?.message ?? "保存失败", 500);
  }
}
