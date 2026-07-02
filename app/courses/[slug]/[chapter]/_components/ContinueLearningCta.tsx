"use client";

/** v20.5: 章节页底部 "标记完成 + 跳下一章" 大按钮 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useProgress } from "@/components/progress-provider";
import { useAuth } from "@/components/auth-provider";

export interface ContinueLearningCtaProps {
  courseSlug: string;
  chapterSlug: string;
  nextHref?: string;
  nextTitle?: string;
  isLastChapter?: boolean;
}

export function ContinueLearningCta({
  courseSlug,
  chapterSlug,
  nextHref,
  nextTitle,
  isLastChapter = false,
}: ContinueLearningCtaProps) {
  const router = useRouter();
  const { user, ready: authReady } = useAuth();
  const { getChapter, toggleCompleted, ready: progressReady } = useProgress();
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (progressReady) {
      setCompleted(getChapter(courseSlug, chapterSlug).completed);
    }
  }, [courseSlug, chapterSlug, progressReady, getChapter]);

  function handleComplete() {
    setBusy(true);
    if (!completed) {
      toggleCompleted(courseSlug, chapterSlug);
      setCompleted(true);
    }
    setTimeout(() => {
      if (nextHref) {
        router.push(nextHref);
      } else {
        router.push(`/courses/${courseSlug}/`);
      }
    }, 600);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-8 overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-violet-50 shadow-soft dark:border-primary-800/50 dark:from-primary-950/30 dark:via-neutral-900 dark:to-violet-950/30"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
          <Sparkles className="h-3.5 w-3.5" />
          {completed ? "已完成 · 继续" : "学完这章?"}
        </div>
        <h3 className="mb-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50 sm:text-xl">
          {isLastChapter
            ? "🎉 你已经学完这门课!"
            : completed
            ? "跳到下一章继续"
            : "标记完成, 进入下一章"}
        </h3>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {isLastChapter
            ? "回到课程目录, 或者生成证书 / 推荐下一门课。"
            : nextTitle
            ? `下一章: ${nextTitle}`
            : "完成会进入你的学习进度统计, 可以在 /me 看到。"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {isLastChapter ? (
            <Link
              href={`/courses/${courseSlug}/`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
            >
              回到课程目录 <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={handleComplete}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-60"
            >
              {completed ? (
                <>
                  <Check className="h-4 w-4" />
                  跳到下一章
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  标记完成 · 继续
                </>
              )}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {!isLastChapter && nextHref && (
            <Link
              href={nextHref}
              className="text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              或直接跳到下一章 →
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
