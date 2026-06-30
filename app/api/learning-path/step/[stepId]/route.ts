/** 单个学习路径 step 操作 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markStepCompleted } from "@/lib/learning-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { stepId: string };
}

/** 标记 step 为完成 */
export async function POST(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // 验证 step 属于当前 user
  const step = await prisma.learningPathStep.findUnique({
    where: { id: params.stepId },
    include: { path: true },
  });
  if (!step) return NextResponse.json({ ok: false, error: "step 不存在" }, { status: 404 });
  if (step.path.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "无权操作" }, { status: 403 });
  }

  try {
    await markStepCompleted(params.stepId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

/** 重置 step 为未完成 */
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const step = await prisma.learningPathStep.findUnique({
    where: { id: params.stepId },
    include: { path: true },
  });
  if (!step) return NextResponse.json({ ok: false, error: "step 不存在" }, { status: 404 });
  if (step.path.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "无权操作" }, { status: 403 });
  }

  try {
    await prisma.learningPathStep.update({
      where: { id: params.stepId },
      data: { completed: false, completedAt: null },
    });
    // 如果 path 是 completed, 改回 active
    if (step.path.status === "completed") {
      await prisma.learningPath.update({
        where: { id: step.pathId },
        data: { status: "active", completedAt: null, isActive: true },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}