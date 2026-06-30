"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Loader2,
  Trash2,
  RotateCcw,
  Award,
  ChevronRight,
  ListChecks,
} from "lucide-react";

interface GoalOption {
  value: string;
  label: string;
  emoji: string;
  desc: string;
}

interface StepData {
  id: string;
  order: number;
  courseSlug: string;
  courseTitle: string;
  chapterSlugs: string[];
  reason: string;
  estHours: number;
  completed: boolean;
  completedAt: string | null;
}

interface PathData {
  id: string;
  goal: string;
  title: string;
  description: string;
  totalHours: number;
  status: string;
  createdAt: string;
  steps: StepData[];
}

interface Props {
  goals: GoalOption[];
  initialPath: PathData | null;
  userName: string;
}

export function LearningPathClient({ goals, initialPath, userName }: Props) {
  const router = useRouter();
  const [path, setPath] = useState<PathData | null>(initialPath);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // 首次渲染时如果有 active path, 不显示选 goal
  if (!path && selectedGoal === null) {
    return (
      <div className="container max-w-4xl py-10 sm:py-14">
        <div className="mb-8 text-center sm:text-left">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
            <Target className="h-3.5 w-3.5" />
            <span>学习路径推荐 (v19.4)</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
            {userName}, 你想成为什么?
          </h1>
          <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
            基于你的目标, 我们会用 4-7 门课生成定制学习路径, 跳过你已经完成的内容。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setSelectedGoal(g.value)}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-700"
            >
              <div className="mb-2 text-3xl">{g.emoji}</div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-indigo-600 dark:text-neutral-50 dark:group-hover:text-indigo-400">
                {g.label}
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{g.desc}</p>
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 用户选了 goal, 但还没生成 (preview 状态)
  if (!path && selectedGoal) {
    return (
      <div className="container max-w-3xl py-10 sm:py-14">
        <button
          type="button"
          onClick={() => setSelectedGoal(null)}
          className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
        >
          ← 重新选择目标
        </button>
        <GoalPreview
          goal={selectedGoal}
          goals={goals}
          onConfirm={async () => {
            setBusy(true);
            setError(null);
            try {
              const res = await fetch("/api/learning-path/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goal: selectedGoal }),
                credentials: "include",
              });
              const json = await res.json();
              if (!res.ok || !json.ok) throw new Error(json.error || "生成失败");
              setPath(json.path);
              startTransition(() => router.refresh());
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
          onChangeGoal={() => setSelectedGoal(null)}
          busy={busy}
          error={error}
        />
      </div>
    );
  }

  // 已生成路径 — 展示 step 列表
  if (!path) return null;

  const completedSteps = path.steps.filter((s) => s.completed).length;
  const progressPct = path.steps.length > 0 ? (completedSteps / path.steps.length) * 100 : 0;
  const totalDone = path.steps
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.estHours, 0);
  const goalLabel = goals.find((g) => g.value === path.goal);

  return (
    <div className="container max-w-4xl py-10 sm:py-14">
      {/* 顶部状态卡 */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 dark:border-neutral-800 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-violet-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="text-lg">{goalLabel?.emoji}</span>
              <span>{goalLabel?.label} 之路</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
              {path.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {path.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" />
                {completedSteps}/{path.steps.length} 步骤
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {totalDone.toFixed(1)}/{path.totalHours.toFixed(0)} 小时
              </span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                {new Date(path.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!confirm("确认删除当前路径? 已完成的章节不会丢失。")) return;
                setBusy(true);
                try {
                  await fetch("/api/learning-path/", { method: "DELETE", credentials: "include" });
                  setPath(null);
                  setSelectedGoal(null);
                  startTransition(() => router.refresh());
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除路径
            </button>
            <button
              type="button"
              onClick={() => {
                setPath(null);
                setSelectedGoal(path.goal);
              }}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重新生成
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-xs text-neutral-500 dark:text-neutral-400">
          {progressPct.toFixed(0)}% 完成
        </div>
      </div>

      {/* step 列表 */}
      <ol className="space-y-3">
        {path.steps.map((step, idx) => (
          <li
            key={step.id}
            className={`rounded-xl border p-5 transition ${
              step.completed
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/10"
                : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                  <div className="grid h-6 w-6 place-items-center rounded-full border-2 border-indigo-300 text-xs font-bold text-indigo-600 dark:border-indigo-700 dark:text-indigo-400">
                    {idx + 1}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/courses/${step.courseSlug}/`}
                    className="text-base font-semibold text-neutral-900 hover:text-indigo-600 dark:text-neutral-50 dark:hover:text-indigo-400"
                  >
                    {step.courseTitle}
                  </Link>
                  {step.estHours > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      <Clock className="h-2.5 w-2.5" />
                      {step.estHours.toFixed(1)}h
                    </span>
                  )}
                  {step.completed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <Award className="h-2.5 w-2.5" />
                      已完成
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {step.reason}
                </p>
                {step.chapterSlugs.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      本步骤 {step.chapterSlugs.length} 章节
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {step.chapterSlugs.slice(0, 4).map((cs) => (
                        <Link
                          key={cs}
                          href={`/courses/${step.courseSlug}/${cs}/`}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                        >
                          {cs}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                      {step.chapterSlugs.length > 4 && (
                        <span className="inline-flex items-center rounded-md border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                          +{step.chapterSlugs.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {!step.completed ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await fetch(`/api/learning-path/step/${step.id}/`, {
                          method: "POST",
                          credentials: "include",
                        });
                        // 本地更新
                        setPath({
                          ...path,
                          steps: path.steps.map((s) =>
                            s.id === step.id
                              ? { ...s, completed: true, completedAt: new Date().toISOString() }
                              : s
                          ),
                        });
                        startTransition(() => router.refresh());
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    标记完成
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await fetch(`/api/learning-path/step/${step.id}/`, {
                          method: "DELETE",
                          credentials: "include",
                        });
                        setPath({
                          ...path,
                          status: "active",
                          steps: path.steps.map((s) =>
                            s.id === step.id ? { ...s, completed: false, completedAt: null } : s
                          ),
                        });
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    重置
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {path.status === "completed" && (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <Award className="mx-auto h-10 w-10 text-emerald-500" />
          <h3 className="mt-3 text-xl font-bold text-emerald-900 dark:text-emerald-100">🎉 路径完成!</h3>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            你已经完成了 {path.steps.length} 步, 恭喜跨入新阶段!
          </p>
          <button
            type="button"
            onClick={() => {
              setPath(null);
              setSelectedGoal(null);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Sparkles className="h-4 w-4" />
            规划下一个目标
          </button>
        </div>
      )}
    </div>
  );
}

// ============ GoalPreview 子组件 ============
function GoalPreview({
  goal,
  goals,
  onConfirm,
  onChangeGoal,
  busy,
  error,
}: {
  goal: string;
  goals: GoalOption[];
  onConfirm: () => void;
  onChangeGoal: () => void;
  busy: boolean;
  error: string | null;
}) {
  const g = goals.find((x) => x.value === goal);
  if (!g) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{g.emoji}</div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            准备生成「{g.label}」学习路径
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {g.desc}。系统会按推荐顺序生成 4-7 门课的路径, 自动跳过你已经完成的章节。
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <strong>智能裁剪</strong>: 根据你当前的章节完成度, 自动调整每步的章节列表。
            比如你已学完 50% 的「机器学习入门」, 路径中会推荐剩下的章节而不是整门课。
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onChangeGoal}
          disabled={busy}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          换一个目标
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          生成我的路径
        </button>
      </div>
    </div>
  );
}