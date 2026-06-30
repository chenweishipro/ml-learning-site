/** 学习路径 API
 *  POST /api/learning-path            — 生成 + 保存 (覆盖现有 active)
 *  GET  /api/learning-path            — 拉取当前 active 路径
 *  GET  /api/learning-path?all=1      — 拉取所有历史路径
 *  DELETE /api/learning-path          — 清除当前 active 路径
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  generatePath,
  savePath,
  getActivePath,
  getAllPaths,
  GOAL_OPTIONS,
  type LearningGoal,
} from "@/lib/learning-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 拉取所有路径 / 当前 active 路径 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const url = new URL(req.url);
  const showAll = url.searchParams.get("all") === "1";

  if (showAll) {
    const paths = await getAllPaths(user.id);
    return NextResponse.json({
      ok: true,
      goals: GOAL_OPTIONS,
      paths: paths.map((p) => ({
        id: p.id,
        goal: p.goal,
        title: p.title,
        description: p.description,
        totalHours: p.totalHours,
        status: p.status,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        completedAt: p.completedAt?.toISOString() || null,
        stepCount: p.steps.length,
        completedSteps: p.steps.filter((s) => s.completed).length,
      })),
    });
  }

  const path = await getActivePath(user.id);
  return NextResponse.json({ ok: true, path, goals: GOAL_OPTIONS });
}

/** 生成 + 保存 (或仅预览不保存) */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { goal, preview } = body || {};
  if (!goal || !GOAL_OPTIONS.find((g) => g.value === goal)) {
    return NextResponse.json(
      { ok: false, error: "无效目标, 必须是 " + GOAL_OPTIONS.map((g) => g.value).join("|") },
      { status: 400 }
    );
  }

  try {
    const generated = await generatePath(goal as LearningGoal, user.id);

    if (preview) {
      // 仅预览, 不保存
      return NextResponse.json({ ok: true, path: generated });
    }

    const id = await savePath(user.id, generated);
    const path = await getActivePath(user.id);
    return NextResponse.json({ ok: true, id, path });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "生成失败" }, { status: 500 });
  }
}

/** 清除当前 active 路径 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    await prisma.learningPath.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false, status: "abandoned" },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}