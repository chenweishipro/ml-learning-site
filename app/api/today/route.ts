// v20.2 今日学习推荐 — 优先周历, 退路学习路径, 再退路第一门课第一章节
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getAllCoursesSync, getChapterWithOverrides } from "@/lib/content-overrides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TodayTask {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  estHours: number;
  reason: string;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401);

  // 1) 周历第一项未完成
  const ws = await prisma.weeklySchedule.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (ws) {
    const task = await prisma.weeklyTask.findFirst({
      where: { scheduleId: ws.id, completed: false },
      orderBy: [{ weekIndex: "asc" }, { dayOfWeek: "asc" }, { studyDate: "asc" }],
    });
    if (task) {
      return ok({
        source: "weekly-schedule",
        tasks: [
          {
            courseSlug: task.courseSlug,
            courseTitle: task.courseTitle,
            chapterSlug: task.chapterSlug,
            chapterTitle: task.chapterTitle,
            estHours: task.estHours,
            reason: "周历推荐",
          } as TodayTask,
        ],
      });
    }
  }

  // 2) 学习路径第一项
  const lp = await prisma.learningPath.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (lp) {
    const firstStep = await prisma.learningPathStep.findFirst({
      where: { pathId: lp.id, completed: false },
      orderBy: { order: "asc" },
    });
    if (firstStep) {
      return ok({
        source: "learning-path",
        tasks: [
          {
            courseSlug: firstStep.courseSlug,
            courseTitle: firstStep.courseTitle,
            chapterSlug: firstStep.chapterSlugs[0] || "",
            chapterTitle: firstStep.reason,
            estHours: firstStep.estHours,
            reason: "学习路径推荐",
          } as TodayTask,
        ],
      });
    }
  }

  // 3) fallback: 第一门课第一章
  const all = getAllCoursesSync() as any[];
  const first = all[0];
  if (first && first.chapters && first.chapters.length) {
    return ok({
      source: "fallback",
      tasks: [
        {
          courseSlug: first.slug,
          courseTitle: first.title,
          chapterSlug: first.chapters[0].slug,
          chapterTitle: first.chapters[0].title,
          estHours: 0.5,
          reason: "新手推荐",
        } as TodayTask,
      ],
    });
  }

  return ok({ source: "none", tasks: [] });
}
