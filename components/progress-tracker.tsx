"use client";

import { useEffect } from "react";
import { Check, Circle } from "lucide-react";
import { useProgress } from "@/components/progress-provider";
import { Button } from "@/components/ui/Button";

/**
 * 章节完成按钮
 * - 初次挂载时自动标记为"已访问"
 * - 客户端组件, 因为依赖 localStorage
 */
export function ChapterProgressButton({
  courseSlug,
  chapterSlug,
}: {
  courseSlug: string;
  chapterSlug: string;
}) {
  const { getChapter, markVisited, toggleCompleted, ready } = useProgress();
  const progress = getChapter(courseSlug, chapterSlug);

  useEffect(() => {
    if (ready) {
      markVisited(courseSlug, chapterSlug);
      // 记录章节进入时间
      (window as any).__chapterStartTime = Date.now();
    }
  }, [ready, courseSlug, chapterSlug, markVisited]);

  if (!ready) {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <Circle className="h-4 w-4" />
        加载中...
      </div>
    );
  }

  async function handleToggle() {
    toggleCompleted(courseSlug, chapterSlug);
    // 记录学习 session 到服务器 (静默, 不阻塞 UI)
    try {
      const startTime = (window as any).__chapterStartTime ?? Date.now();
      const duration = Math.min(3600, Math.max(1, Math.floor((Date.now() - startTime) / 1000)));
      await fetch("/api/study/session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseSlug,
          chapterSlug,
          durationSec: duration,
          completed: !progress.completed,
        }),
      });
    } catch {}
  }

  return (
    <Button
      onClick={handleToggle}
      variant={progress.completed ? "primary" : "outline"}
      size="sm"
      className="gap-1.5"
    >
      {progress.completed ? (
        <>
          <Check className="h-4 w-4" />
          已完成
        </>
      ) : (
        <>
          <Circle className="h-4 w-4" />
          标记完成
        </>
      )}
    </Button>
  );
}
