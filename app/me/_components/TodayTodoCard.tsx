"use client";

/** v20.3 /me 顶部 "今日学习" 大卡片 (跟 v20.2 banner 互通) */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Calendar, Target } from "lucide-react";

interface TodayTask {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  estHours: number;
  reason: string;
}

export function TodayTodoCard() {
  const [task, setTask] = useState<TodayTask | null>(null);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/today/", { credentials: "include" });
        if (r.status === 401) return setLoading(false);
        const j = await r.json();
        if (j.ok) {
          setSource(j.data?.source || "");
          setTask(j.data?.tasks?.[0] || null);
        }
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  if (!task) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <Target className="h-4 w-4" />
          🎉 已完成所有推荐章节
        </div>
        <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
          去看看 <Link href="/courses/" className="underline">课程目录</Link> 或{" "}
          <Link href="/me/learning-path/" className="underline">生成新路径</Link>。
        </p>
      </div>
    );
  }

  const sourceLabel: Record<string, string> = {
    "weekly-schedule": "周历",
    "learning-path": "学习路径",
    fallback: "新手推荐",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/courses/${task.courseSlug}/${task.chapterSlug}/`}
        className="group block overflow-hidden rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-violet-50 shadow-soft transition hover:shadow-glow dark:border-primary-800/50 dark:from-primary-950/30 dark:via-neutral-900 dark:to-violet-950/30"
      >
        <div className="flex items-center gap-4 p-4">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 text-white shadow-soft">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2 text-[11px] uppercase tracking-wide text-primary-600 dark:text-primary-400">
              <Calendar className="h-3 w-3" />
              今天学这个
              {source && (
                <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  {sourceLabel[source] || source}
                </span>
              )}
            </div>
            <div className="line-clamp-1 text-sm font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300 sm:text-base">
              {task.chapterTitle}
            </div>
            <div className="line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
              {task.courseTitle}
              {task.estHours > 0 ? ` · 约 ${task.estHours} 小时` : ""}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
