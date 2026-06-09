// 学习仪表盘汇总
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/study";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401);

  const summary = await getDashboardSummary(user.id);
  return ok({ summary });
}
