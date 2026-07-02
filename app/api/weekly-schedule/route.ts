/** 周计划 API
 *  POST   /api/weekly-schedule/   body: {daysPerWeek?, chaptersPerDay?, totalWeeks?, pathId?, title?}
 *  GET    /api/weekly-schedule/   拉当前 active schedule + tasks
 *  GET    /api/weekly-schedule/?all=1  拉历史
 *  DELETE /api/weekly-schedule/   清除当前 active
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createSchedule,
  getActiveSchedule,
  getAllSchedules,
} from "@/lib/weekly-schedule";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const url = new URL(req.url);
  const showAll = url.searchParams.get("all") === "1";

  if (showAll) {
    const list = await getAllSchedules(user.id);
    return NextResponse.json({
      ok: true,
      schedules: list.map((s: any) => ({
        id: s.id,
        title: s.title,
        weekStart: s.weekStart.toISOString(),
        totalWeeks: s.totalWeeks,
        daysPerWeek: s.daysPerWeek,
        chaptersPerDay: s.chaptersPerDay,
        status: s.status,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        completedAt: s.completedAt?.toISOString() || null,
      })),
    });
  }

  const sched = await getActiveSchedule(user.id);
  return NextResponse.json({ ok: true, schedule: sched });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { daysPerWeek, chaptersPerDay, totalWeeks, pathId, title } = body || {};

  try {
    const id = await createSchedule({
      userId: user.id,
      daysPerWeek: typeof daysPerWeek === "number" ? daysPerWeek : 5,
      chaptersPerDay: typeof chaptersPerDay === "number" ? chaptersPerDay : 2,
      totalWeeks: typeof totalWeeks === "number" ? totalWeeks : 8,
      pathId: typeof pathId === "string" ? pathId : undefined,
      title: typeof title === "string" ? title : undefined,
    });
    const sched = await getActiveSchedule(user.id);
    return NextResponse.json({ ok: true, id, schedule: sched });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "生成失败" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    await prisma.weeklySchedule.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false, status: "abandoned" },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
