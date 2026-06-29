"use client";

import Link from "next/link";
import { History, CheckCircle2, BookOpen } from "lucide-react";

interface Chapter {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  completed: boolean;
  updatedAt: string;
  minutes: number;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
};

export function RecentChapters({ items }: { items: Chapter[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-primary-600" />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
          最近学习
        </h3>
        <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
          最近 {items.length} 条
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
          📖 还没有学习记录, <Link href="/courses/" className="text-primary-600 hover:underline">开始第一课</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i}>
              <Link
                href={it.courseSlug ? `/courses/${it.courseSlug}/` : "/courses/"}
                className="group flex items-start gap-3 rounded-lg p-2 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${it.completed ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400"}`}>
                  {it.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                    {it.chapterTitle}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="truncate">{it.courseTitle}</span>
                    <span>·</span>
                    <span>{timeAgo(it.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}