// 单个问题详情
import { getQuestion } from "@/lib/qa";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const q = await getQuestion(params.id);
  if (!q) return fail("问题不存在", 404);
  return ok({ question: q });
}
