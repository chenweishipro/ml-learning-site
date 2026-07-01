/** 单个周任务操作 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markTaskCompleted, unmarkTaskCompleted } from "@/lib/weekly-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params { params: { taskId: string } }

export async function POST(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const task = await prisma.weeklyTask.findUnique({
    where: { id: params.taskId },
    include: { schedule: true },
  });
  if (!task) return NextResponse.json({ ok: false, error: "task 不存在" }, { status: 404 });
  if (task.schedule.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "无权操作" }, { status: 403 });
  }

  try {
    await markTaskCompleted(params.taskId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const task = await prisma.weeklyTask.findUnique({
    where: { id: params.taskId },
    include: { schedule: true },
  });
  if (!task) return NextResponse.json({ ok: false, error: "task 不存在" }, { status: 404 });
  if (task.schedule.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "无权操作" }, { status: 403 });
  }

  try {
    await unmarkTaskCompleted(params.taskId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
