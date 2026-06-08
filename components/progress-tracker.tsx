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
    if (ready) markVisited(courseSlug, chapterSlug);
  }, [ready, courseSlug, chapterSlug, markVisited]);

  if (!ready) {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <Circle className="h-4 w-4" />
        加载中...
      </div>
    );
  }

  return (
    <Button
      onClick={() => toggleCompleted(courseSlug, chapterSlug)}
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
