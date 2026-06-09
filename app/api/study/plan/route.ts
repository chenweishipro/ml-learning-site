// 学习计划
import { getCurrentUser } from "@/lib/auth";
import { getActiveStudyPlan, upsertStudyPlan } from "@/lib/study";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401);

  const plan = await getActiveStudyPlan(user.id);
  return ok({ plan });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401);

  const body = await readJson<{
    courseSlug?: string;
    dailyTarget?: number;
    targetDate?: string | null;
  }>(req);
  if (!body || !body.courseSlug) return fail("缺少 courseSlug", 400);
  if (!body.dailyTarget || body.dailyTarget < 1 || body.dailyTarget > 20) {
    return fail("dailyTarget 必须在 1-20 之间", 400);
  }

  const plan = await upsertStudyPlan({
    userId: user.id,
    courseSlug: body.courseSlug,
    dailyTarget: body.dailyTarget,
    targetDate: body.targetDate ? new Date(body.targetDate) : null,
  });
  return ok({ plan });
}
