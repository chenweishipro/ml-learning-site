"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Sparkles,
  Trash2,
  RotateCcw,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react";

interface TaskData {
  id: string;
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  estHours: number;
  weekIndex: number;
  dayOfWeek: number;
  studyDate: string;
  completed: boolean;
  completedAt: string | null;
}

interface ScheduleData {
  id: string;
  title: string;
  weekStart: string;
  totalWeeks: number;
  daysPerWeek: number;
  chaptersPerDay: number;
  totalTasks: number;
  tasks: TaskData[];
}

interface PathData {
  id: string;
  goal: string;
  title: string;
  totalHours: number;
  steps: Array<{ id: string; courseTitle: string; chapterSlugs: string[] }>;
}

interface Props {
  initialSchedule: ScheduleData | null;
  activePath: PathData | null;
  userName: string;
}

const WEEKDAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function WeeklyScheduleClient({ initialSchedule, activePath, userName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPathId = searchParams.get("pathId");
  const [schedule, setSchedule] = useState<ScheduleData | null>(initialSchedule);
  const [autoStarted, setAutoStarted] = useState(false);

  // 从 ?pathId= 自动触发生成 (用户从 learning-path 跳转过来)
  useEffect(() => {
    if (autoPathId && !initialSchedule && !autoStarted) {
      setAutoStarted(true);
      (async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/weekly-schedule/", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              daysPerWeek: 5,
              chaptersPerDay: 2,
              totalWeeks: 8,
              pathId: autoPathId,
              title: activePath ? `${activePath.title} · 周历` : undefined,
            }),
          });
          const j = await res.json();
          if (res.ok && j.ok) setSchedule(j.schedule);
        } catch (e) {
          console.error("auto-generate schedule failed:", e);
        } finally {
          setBusy(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPathId, initialSchedule, autoStarted]);
  const [showSettings, setShowSettings] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [chaptersPerDay, setChaptersPerDay] = useState(2);
  const [totalWeeks, setTotalWeeks] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-schedule/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysPerWeek,
          chaptersPerDay,
          totalWeeks,
          pathId: activePath?.id,
          title: activePath ? `${activePath.title} · 周历` : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "生成失败");
      setSchedule(j.schedule);
      setShowSettings(false);
      startTransition(() => router.refresh());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const method = completed ? "DELETE" : "POST";
      await fetch(`/api/weekly-schedule/task/${taskId}/`, {
        method,
        credentials: "include",
      });
      setSchedule((prev) => {
        if (!prev) return prev;
        const newTasks = prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, completed: !completed, completedAt: !completed ? new Date().toISOString() : null }
            : t
        );
        const totalDone = newTasks.filter((t) => t.completed).length;
        return {
          ...prev,
          tasks: newTasks,
          // status 在客户端先计算
        };
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function deleteSchedule() {
    if (!confirm("确认删除当前周历? 任务记录会保留但会标记为 abandoned。")) return;
    setBusy(true);
    try {
      await fetch("/api/weekly-schedule/", { method: "DELETE", credentials: "include" });
      setSchedule(null);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  // 第一次访问 — 无 schedule, 引导生成
  if (!schedule) {
    return (
      <div className="container max-w-3xl py-10 sm:py-14">
        <div className="mb-8 text-center sm:text-left">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Calendar className="h-3.5 w-3.5" />
            <span>学习周历 (v19.6)</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
            {userName}, 排个学习日程吧
          </h1>
          <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
            {activePath
              ? `已检测到你当前有「${activePath.title}」, 系统会自动按路径展开成周计划。`
              : "没找到学习路径, 系统会按课程顺序生成。也可以先到 /me/learning-path/ 生成路径。"}
          </p>
        </div>

        {!showSettings ? (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Sparkles className="h-4 w-4" />
            排个学习日程
          </button>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-50">
              <Settings className="-mt-0.5 mr-1.5 inline h-4 w-4" />
              安排你的学习节奏
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                label="每周学习天数"
                hint="默认 5 (周一到周五)"
                value={daysPerWeek}
                onChange={setDaysPerWeek}
                min={1}
                max={7}
              />
              <NumberField
                label="每天章节数"
                hint="1-8 章"
                value={chaptersPerDay}
                onChange={setChaptersPerDay}
                min={1}
                max={8}
              />
              <NumberField
                label="总周数"
                hint="1-52 周"
                value={totalWeeks}
                onChange={setTotalWeeks}
                min={1}
                max={52}
              />
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="flex items-start gap-2">
                <Target className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <strong>预计产出</strong>: 每周 {daysPerWeek * chaptersPerDay} 章节, {totalWeeks} 周共 {Math.min(daysPerWeek * chaptersPerDay * totalWeeks, 999)} 章节。
                  {activePath ? " 当前活跃路径里的章节会被优先排进去。" : ""}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                disabled={busy}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                生成我的学习周历
              </button>
            </div>
          </div>
        )}

        {!activePath && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200">
            💡 提示: 先去 <Link href="/me/learning-path/" className="font-medium underline">/me/learning-path/</Link> 生成学习路径, 周历会自动按路径排课。
          </div>
        )}
      </div>
    );
  }

  // 有 schedule — 显示周历
  const completed = schedule.tasks.filter((t) => t.completed).length;
  const progressPct = schedule.totalTasks > 0 ? (completed / schedule.totalTasks) * 100 : 0;

  // 按 weekIndex 分组
  const weeksMap = new Map<number, TaskData[]>();
  for (const t of schedule.tasks) {
    if (!weeksMap.has(t.weekIndex)) weeksMap.set(t.weekIndex, []);
    weeksMap.get(t.weekIndex)!.push(t);
  }

  const weekStartDate = new Date(schedule.weekStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 找当前周 (today 落在哪一周)
  let currentWeekIndex = 0;
  for (let w = 0; w < schedule.totalWeeks; w++) {
    const wStart = new Date(weekStartDate);
    wStart.setDate(wStart.getDate() + w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    if (today >= wStart && today < wEnd) {
      currentWeekIndex = w;
      break;
    }
  }

  // 当前周日期数组 (周一到周日)
  const currentWeekStart = new Date(weekStartDate);
  currentWeekStart.setDate(currentWeekStart.getDate() + currentWeekIndex * 7);
  const weekDates: Date[] = [];
  for (let d = 0; d < 7; d++) {
    const dd = new Date(currentWeekStart);
    dd.setDate(dd.getDate() + d);
    weekDates.push(dd);
  }

  return (
    <div className="container max-w-6xl py-8 sm:py-12">
      {/* 顶部状态卡 */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 dark:border-neutral-800 dark:from-emerald-950/30 dark:via-neutral-900 dark:to-teal-950/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>学习周历 (v19.6)</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl dark:text-neutral-50">
              {schedule.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span>共 {schedule.totalTasks} 任务</span>
              <span>·</span>
              <span>每周 {schedule.daysPerWeek} 天 × {schedule.chaptersPerDay} 章</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400">{completed} 已完成 ({progressPct.toFixed(0)}%)</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <Settings className="h-3.5 w-3.5" />
              调整节奏
            </button>
            <button
              type="button"
              onClick={deleteSchedule}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除
            </button>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 当前周: 7 列日历 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          第 {currentWeekIndex + 1} 周 / 共 {schedule.totalWeeks} 周
          <span className="ml-2 text-xs font-normal text-neutral-500 dark:text-neutral-400">
            ({weekDates[0].toLocaleDateString("zh-CN")} ~ {weekDates[6].toLocaleDateString("zh-CN")})
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentWeekIndex === 0}
            onClick={() => {/* 简化: 不做翻页 */}}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={currentWeekIndex >= schedule.totalWeeks - 1}
            onClick={() => {}}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-7">
        {weekDates.map((d, dow) => {
          const tasksToday = weeksMap.get(currentWeekIndex)?.filter((t) => t.dayOfWeek === dow) || [];
          const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
          const isPast = d < today && !isToday;
          return (
            <div
              key={dow}
              className={`min-h-[160px] rounded-xl border p-3 ${
                isToday
                  ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30"
                  : isPast
                  ? "border-neutral-200 bg-neutral-50/30 dark:border-neutral-800 dark:bg-neutral-900/30"
                  : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
                    {WEEKDAY_NAMES[dow]}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {d.getMonth() + 1}/{d.getDate()}
                  </div>
                </div>
                {isToday && (
                  <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    TODAY
                  </span>
                )}
              </div>
              {tasksToday.length === 0 ? (
                <div className="grid h-[100px] place-items-center text-center text-[10px] text-neutral-300 dark:text-neutral-600">
                  休息日
                </div>
              ) : (
                <div className="space-y-1.5">
                  {tasksToday.map((t) => (
                    <TaskCard key={t.id} t={t} onToggle={toggleTask} busy={busy} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 全部周概览 (折叠) */}
      <details className="mt-8 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300">
          查看全部 {schedule.totalWeeks} 周概览
        </summary>
        <div className="mt-3 space-y-2">
          {Array.from({ length: schedule.totalWeeks }, (_, w) => {
            const weekTasks = weeksMap.get(w) || [];
            const done = weekTasks.filter((t) => t.completed).length;
            return (
              <div key={w} className="flex items-center gap-3 text-xs">
                <span className="w-16 flex-shrink-0 text-neutral-500">第 {w + 1} 周</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: weekTasks.length > 0 ? `${(done / weekTasks.length) * 100}%` : 0 }}
                  />
                </div>
                <span className="w-20 flex-shrink-0 text-right text-neutral-600 dark:text-neutral-400">
                  {done}/{weekTasks.length} 章
                </span>
              </div>
            );
          })}
        </div>
      </details>

      {/* 完成庆祝 */}
      {completed === schedule.totalTasks && (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <Trophy className="mx-auto h-10 w-10 text-emerald-500" />
          <h3 className="mt-3 text-xl font-bold text-emerald-900 dark:text-emerald-100">🎉 周历完成!</h3>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            你已经完成了全部 {schedule.totalTasks} 个学习任务!
          </p>
          <button
            type="button"
            onClick={() => setSchedule(null)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Sparkles className="h-4 w-4" />
            规划下一阶段
          </button>
        </div>
      )}

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 text-base font-semibold">重新安排节奏</h3>
            <p className="mb-4 text-xs text-neutral-500">
              重新生成会覆盖当前 active 周历 (已完成的 task 不会迁移)。
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField label="天/周" hint="" value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} />
              <NumberField label="章/天" hint="" value={chaptersPerDay} onChange={setChaptersPerDay} min={1} max={8} />
              <NumberField label="周数" hint="" value={totalWeeks} onChange={setTotalWeeks} min={1} max={52} />
            </div>
            {error && <div className="mt-2 text-xs text-rose-600">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                disabled={busy}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
              >
                取消
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                重新生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isFinite(v)) return;
          onChange(Math.max(min, Math.min(max, Math.round(v))));
        }}
        min={min}
        max={max}
        className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900"
      />
      {hint && <p className="mt-0.5 text-[10px] text-neutral-500">{hint}</p>}
    </div>
  );
}

function TaskCard({
  t,
  onToggle,
  busy,
}: {
  t: TaskData;
  onToggle: (id: string, completed: boolean) => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(t.id, t.completed)}
      disabled={busy}
      className={`group block w-full rounded-md border p-1.5 text-left transition ${
        t.completed
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
          : "border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-emerald-700"
      }`}
      title={`${t.courseTitle} · ${t.chapterTitle}`}
    >
      <div className="flex items-start gap-1.5">
        {t.completed ? (
          <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-500" />
        ) : (
          <Circle className="mt-0.5 h-3 w-3 flex-shrink-0 text-neutral-300 group-hover:text-emerald-500" />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`line-clamp-2 text-[10px] font-medium leading-tight ${
              t.completed
                ? "text-emerald-700 line-through dark:text-emerald-300"
                : "text-neutral-900 dark:text-neutral-50"
            }`}
          >
            {t.chapterTitle}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[9px] text-neutral-500 dark:text-neutral-400">
            <span className="line-clamp-1">{t.courseTitle}</span>
            <span>·</span>
            <span>{t.estHours.toFixed(1)}h</span>
          </div>
        </div>
      </div>
    </button>
  );
}
