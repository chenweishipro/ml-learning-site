/** 客户端上报 A/B 事件 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");

  const body = await readJson<{ experimentKey: string; variantId: string; type: string; metadata?: any }>(req);
  if (!body?.experimentKey || !body?.variantId || !body?.type) {
    return fail("请求格式错误", 400);
  }

  const experiment = await prisma.experiment.findUnique({ where: { key: body.experimentKey } });
  if (!experiment) return fail("实验不存在", 404);

  const event = await prisma.experimentEvent.create({
    data: {
      experimentId: experiment.id,
      variantId: body.variantId,
      userId: user.id,
      type: body.type,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    },
  });
  return ok({ event });
}
