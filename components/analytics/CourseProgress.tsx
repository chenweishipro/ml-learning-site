"use client";

import Link from "next/link";
import { Layers, ChevronRight } from "lucide-react";

interface Course {
  slug: string;
  title: string;
  level: string;
  totalChapters: number;
  completedChapters: number;
  completionRate: number;
  totalMinutes: number;
}

const LEVEL_COLOR: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50",
  intermediate: "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50",
  advanced: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

export function CourseProgress({ courses }: { courses: Course[] }) {
  // 过滤有进度的课程
  const inProgress = courses.filter((c) => c.completedChapters > 0);
  const notStarted = courses.filter((c) => c.completedChapters === 0).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* 学习中 */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary-600" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            正在学 · {inProgress.length} 门
          </h3>
        </div>

        {inProgress.length === 0 ? (
          <div className="rounded-lg bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
            还没有开始任何课程 ·
            <Link href="/courses/" className="ml-1 text-primary-600 hover:underline">
              去课程列表看看
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgress.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}/`}
                className="group block"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                        {c.title}
                      </div>
                      <span className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${LEVEL_COLOR[c.level] || LEVEL_COLOR.beginner}`}>
                        {LEVEL_LABEL[c.level] || "入门"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.completionRate >= 100
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                              : c.completionRate >= 50
                              ? "bg-gradient-to-r from-primary-500 to-primary-400"
                              : "bg-gradient-to-r from-amber-500 to-amber-400"
                          }`}
                          style={{ width: `${Math.min(100, c.completionRate)}%` }}
                        />
                      </div>
                      <div className="shrink-0 text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                        {c.completedChapters} / {c.totalChapters} · {c.completionRate.toFixed(0)}%
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-400">
                      近 30 天 {c.totalMinutes} 分钟
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 推荐开始 */}
      {notStarted.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">🚀</span>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              推荐开始
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {notStarted.map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}/`}
                className="group flex items-center gap-2 rounded-lg border border-neutral-200 p-3 transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-neutral-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50">
                    {c.title}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {c.totalChapters} 章 · {LEVEL_LABEL[c.level] || "入门"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 group-hover:text-primary-500" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}