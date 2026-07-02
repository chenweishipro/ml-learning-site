"use client";

/** v20.2 首页"今天学什么" — 已登录用户显示 1 张大卡片推荐 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Calendar, Sparkles, Target } from "lucide-react";

interface TodayTask {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  estHours: number;
  reason: string;
}

export function TodayStudyBanner() {
  const [task, setTask] = useState<TodayTask | null>(null);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/today/", { credentials: "include" });
        if (r.status === 401) {
          setLoggedIn(false);
          setLoading(false);
          return;
        }
        const j = await r.json();
        if (j.ok) {
          setLoggedIn(true);
          setSource(j.data?.source || "");
          setTask(j.data?.tasks?.[0] || null);
        }
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  if (loading) return null;
  if (!loggedIn) {
    // 未登录: 提示注册
    return (
      <section className="container py-6">
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-violet-50 p-5 sm:flex-row sm:gap-4 dark:border-primary-800/50 dark:from-primary-950/30 dark:to-violet-950/30">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                登录后看到今日学习推荐
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                自动从你的学习路径 / 周历 / 进度里挑一节
              </div>
            </div>
          </div>
          <Link
            href="/register/"
            className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
          >
            立即注册 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="container py-6">
        <Link
          href="/me/learning-path/"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 transition hover:shadow-soft dark:border-emerald-800/50 dark:from-emerald-950/30 dark:to-teal-950/30"
        >
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-sm font-medium">🎉 你已经完成所有推荐章节</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                生成新学习路径或选下一门课继续
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-600" />
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href={`/courses/${task.courseSlug}/${task.chapterSlug}/`}
          className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft transition hover:shadow-glow dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 text-white shadow-soft sm:h-14 sm:w-14">
              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 font-medium text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                  <Calendar className="h-3 w-3" />
                  今天学这个
                </span>
                <span>· {task.reason}</span>
                {task.estHours > 0 && <span>· 约 {task.estHours} 小时</span>}
              </div>
              <div className="line-clamp-1 text-base font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300 sm:text-lg">
                {task.chapterTitle}
              </div>
              <div className="mt-0.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
                {task.courseTitle}
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
              开始学习
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
