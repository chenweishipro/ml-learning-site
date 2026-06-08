"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock, ListTree } from "lucide-react";
import type { ChapterMeta } from "@/content/courses/_index";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { useProgress } from "@/components/progress-provider";

export interface ChapterSidebarProps {
  courseSlug: string;
  courseTitle: string;
  chapters: ChapterMeta[];
  currentSlug: string;
  progress: number;
}

export function ChapterSidebar({
  courseSlug,
  courseTitle,
  chapters,
  currentSlug,
  progress,
}: ChapterSidebarProps) {
  const { getChapter, getCompletedCount, ready } = useProgress();
  const completed = ready ? getCompletedCount(courseSlug) : 0;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      <Link
        href={`/courses/${courseSlug}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
      >
        <ListTree className="h-3.5 w-3.5" />
        课程目录
      </Link>
      <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
        {courseTitle}
      </h2>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>学习进度</span>
          <span className="font-mono">
            {ready ? `${completed} / ${chapters.length}` : `-- / ${chapters.length}`}
          </span>
        </div>
        <ProgressBar value={ready ? Math.round((completed / chapters.length) * 100) : progress} />
      </div>

      <ol className="mt-5 space-y-1">
        {chapters.map((chapter, idx) => {
          const active = chapter.slug === currentSlug;
          const isPast = idx < chapters.findIndex((c) => c.slug === currentSlug);
          const chapterProgress = ready ? getChapter(courseSlug, chapter.slug) : { visited: false, completed: false };
          const isCompleted = chapterProgress.completed;
          return (
            <li key={chapter.slug}>
              <Link
                href={`/courses/${courseSlug}/${chapter.slug}`}
                className={cn(
                  "group flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm transition",
                  active
                    ? "bg-primary-50 text-primary-800 ring-1 ring-primary-200 dark:bg-primary-950/40 dark:text-primary-200 dark:ring-primary-800"
                    : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                )}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-accent-500" />
                  ) : active ? (
                    <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  ) : isPast ? (
                    <CheckCircle2 className="h-4 w-4 text-accent-500/70" />
                  ) : (
                    <Circle className="h-4 w-4 text-neutral-300 group-hover:text-neutral-400 dark:text-neutral-600" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {chapter.title}
                  </span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock className="h-3 w-3" />
                    {chapter.duration}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
