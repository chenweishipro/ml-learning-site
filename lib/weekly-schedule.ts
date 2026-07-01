/** 周计划生成 (v19.6)
 *
 * 输入: 用户当前 active LearningPath (可选) + 节奏参数 (daysPerWeek / chaptersPerDay / totalWeeks)
 * 输出: WeeklySchedule + WeeklyTask 列表
 *
 * 算法:
 *  1. 取 LearningPath 的 steps, 每步有 chapterSlugs (subset of 课程)
 *  2. 展平为 chapter list: [{ courseSlug, courseTitle, chapterSlug, chapterTitle, estHours }]
 *  3. 按周/天排程, 跳过周末
 */
import { prisma } from "./db";
import { getAllCourses, getCourse } from "./content";
import type { GeneratedPath } from "./learning-path";

export interface ScheduleInput {
  userId: string;
  daysPerWeek?: number;
  chaptersPerDay?: number;
  totalWeeks?: number;
  pathId?: string;
  title?: string;
}

export interface ChapterTask {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  estHours: number;
}

export interface ScheduledTask extends ChapterTask {
  weekIndex: number;
  dayOfWeek: number;
  studyDate: Date;
}

export interface ScheduleResult {
  id: string;
  title: string;
  weekStart: Date;
  totalWeeks: number;
  daysPerWeek: number;
  chaptersPerDay: number;
  totalTasks: number;
  tasks: Array<ScheduledTask & { id: string; completed: boolean; completedAt: Date | null }>;
}

/** 取章节列表 (基于 LearningPath 或退路) */
export async function getChapterList(opts: { pathId?: string; userId?: string }): Promise<ChapterTask[]> {
  // 1. 优先 pathId
  if (opts.pathId && opts.userId) {
    const path = await prisma.learningPath.findFirst({
      where: { id: opts.pathId, userId: opts.userId },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (path) return expandPathSteps(path.steps);
  }
  // 2. active path
  if (opts.userId) {
    const active = await prisma.learningPath.findFirst({
      where: { userId: opts.userId, isActive: true },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (active) return expandPathSteps(active.steps);
  }
  // 3. 退路
  return defaultChapterList();
}

function expandPathSteps(steps: Array<{ courseSlug: string; courseTitle: string; chapterSlugs: string; estHours: number }>): ChapterTask[] {
  const result: ChapterTask[] = [];
  for (const step of steps) {
    let chapterSlugs: string[] = [];
    try { chapterSlugs = JSON.parse(step.chapterSlugs || "[]"); } catch {}
    const course = getCourse(step.courseSlug);
    if (chapterSlugs.length === 0) {
      const chapters = course?.chapters ?? [];
      const perHour = step.estHours / Math.max(1, chapters.length);
      for (const ch of chapters) {
        result.push({
          courseSlug: step.courseSlug, courseTitle: step.courseTitle,
          chapterSlug: ch.slug, chapterTitle: ch.title,
          estHours: Math.round(perHour * 10) / 10,
        });
      }
    } else {
      const perHour = step.estHours / Math.max(1, chapterSlugs.length);
      for (const cs of chapterSlugs) {
        const ch = course?.chapters.find((c) => c.slug === cs);
        result.push({
          courseSlug: step.courseSlug, courseTitle: step.courseTitle,
          chapterSlug: cs, chapterTitle: ch?.title || cs,
          estHours: Math.round(perHour * 10) / 10,
        });
      }
    }
  }
  return result;
}

function defaultChapterList(): ChapterTask[] {
  const courses = getAllCourses().slice(0, 6);
  const result: ChapterTask[] = [];
  for (const c of courses) {
    const chapters = (c.chapters ?? []).slice(0, 4);
    for (const ch of chapters) {
      result.push({
        courseSlug: c.slug, courseTitle: c.title,
        chapterSlug: ch.slug, chapterTitle: ch.title,
        estHours: 1.0,
      });
    }
  }
  return result;
}

/** 计算周一 00:00 */
function getWeekStart(d: Date = new Date()): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start;
}

/** 排程: N 周 × M 天 (跳过周末) */
export function scheduleTasks(
  chapters: ChapterTask[],
  daysPerWeek: number,
  chaptersPerDay: number,
  totalWeeks: number,
  weekStart: Date = getWeekStart()
): ScheduledTask[] {
  const studyDays: number[] = [];
  for (let i = 0; i < 7 && studyDays.length < daysPerWeek; i++) {
    if (i < 5) studyDays.push(i);
  }
  if (daysPerWeek >= 6 && !studyDays.includes(5)) studyDays.push(5);
  if (daysPerWeek >= 7 && !studyDays.includes(6)) studyDays.push(6);
  studyDays.sort((a, b) => a - b);

  const tasks: ScheduledTask[] = [];
  let idx = 0;
  for (let w = 0; w < totalWeeks && idx < chapters.length; w++) {
    for (let d = 0; d < studyDays.length && idx < chapters.length; d++) {
      const dayOfWeek = studyDays[d];
      const studyDate = new Date(weekStart);
      studyDate.setDate(studyDate.getDate() + w * 7 + dayOfWeek);
      for (let c = 0; c < chaptersPerDay && idx < chapters.length; c++) {
        tasks.push({
          ...chapters[idx],
          weekIndex: w,
          dayOfWeek,
          studyDate,
        });
        idx++;
      }
    }
  }
  return tasks;
}

/** 创建周计划 + 任务 */
export async function createSchedule(input: ScheduleInput): Promise<string> {
  const daysPerWeek = Math.max(1, Math.min(7, input.daysPerWeek ?? 5));
  const chaptersPerDay = Math.max(1, Math.min(8, input.chaptersPerDay ?? 2));
  const totalWeeks = Math.max(1, Math.min(52, input.totalWeeks ?? 8));

  const chapters = await getChapterList({ pathId: input.pathId, userId: input.userId });
  const weekStart = getWeekStart();
  const scheduledTasks = scheduleTasks(chapters, daysPerWeek, chaptersPerDay, totalWeeks, weekStart);

  // 把现有 active 标记为 abandoned
  await prisma.weeklySchedule.updateMany({
    where: { userId: input.userId, isActive: true },
    data: { isActive: false, status: "abandoned" },
  });

  const schedule = await prisma.weeklySchedule.create({
    data: {
      userId: input.userId,
      pathId: input.pathId ?? null,
      weekStart,
      totalWeeks,
      daysPerWeek,
      chaptersPerDay,
      title: input.title || `学习周历 (${chapters.length} 章 / ${totalWeeks} 周)`,
      status: "active",
      isActive: true,
      tasks: {
        create: scheduledTasks.map((t) => ({
          weekIndex: t.weekIndex,
          dayOfWeek: t.dayOfWeek,
          studyDate: t.studyDate,
          courseSlug: t.courseSlug,
          courseTitle: t.courseTitle,
          chapterSlug: t.chapterSlug,
          chapterTitle: t.chapterTitle,
          estHours: t.estHours,
        })),
      },
    },
  });
  return schedule.id;
}

export async function getActiveSchedule(userId: string): Promise<ScheduleResult | null> {
  const sched = await prisma.weeklySchedule.findFirst({
    where: { userId, isActive: true },
    include: { tasks: { orderBy: [{ weekIndex: "asc" }, { dayOfWeek: "asc" }] } },
  });
  if (!sched) return null;
  return {
    id: sched.id,
    title: sched.title,
    weekStart: sched.weekStart,
    totalWeeks: sched.totalWeeks,
    daysPerWeek: sched.daysPerWeek,
    chaptersPerDay: sched.chaptersPerDay,
    totalTasks: sched.tasks.length,
    tasks: sched.tasks.map((t) => ({
      id: t.id,
      courseSlug: t.courseSlug,
      courseTitle: t.courseTitle,
      chapterSlug: t.chapterSlug,
      chapterTitle: t.chapterTitle,
      estHours: t.estHours,
      weekIndex: t.weekIndex,
      dayOfWeek: t.dayOfWeek,
      studyDate: t.studyDate,
      completed: t.completed,
      completedAt: t.completedAt,
    })),
  };
}

export async function getAllSchedules(userId: string, limit = 10) {
  return prisma.weeklySchedule.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markTaskCompleted(taskId: string): Promise<void> {
  await prisma.weeklyTask.update({
    where: { id: taskId },
    data: { completed: true, completedAt: new Date() },
  });
  const task = await prisma.weeklyTask.findUnique({
    where: { id: taskId },
    select: { scheduleId: true },
  });
  if (!task) return;
  const remaining = await prisma.weeklyTask.count({
    where: { scheduleId: task.scheduleId, completed: false },
  });
  if (remaining === 0) {
    await prisma.weeklySchedule.update({
      where: { id: task.scheduleId },
      data: { status: "completed", completedAt: new Date(), isActive: false },
    });
  }
}

export async function unmarkTaskCompleted(taskId: string): Promise<void> {
  await prisma.weeklyTask.update({
    where: { id: taskId },
    data: { completed: false, completedAt: null },
  });
  const task = await prisma.weeklyTask.findUnique({
    where: { id: taskId },
    select: { scheduleId: true },
  });
  if (task) {
    await prisma.weeklySchedule.update({
      where: { id: task.scheduleId },
      data: { status: "active", completedAt: null, isActive: true },
    });
  }
}
