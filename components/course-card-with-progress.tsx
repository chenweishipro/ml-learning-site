"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import type { CourseMeta } from "@/content/courses/_index";
import { LEVEL_META, cn } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProgress } from "@/components/progress-provider";

export function CourseCardWithProgress({ course }: { course: CourseMeta }) {
  const { getCompletedCount, getCoursePercent, ready } = useProgress();
  const completed = ready ? getCompletedCount(course.slug) : 0;
  const percent = ready ? getCoursePercent(course.slug) : 0;
  const total = course.chapters.length;
  const isComplete = percent === 100;

  return (
    <Link href={`/courses/${course.slug}/`} className="group block">
      <Card hoverable className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
              LEVEL_META[course.level].classes
            )}
          >
            {LEVEL_META[course.level].label}
          </span>
          {isComplete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700 ring-1 ring-accent-200 dark:bg-accent-950/30 dark:text-accent-300 dark:ring-accent-800">
              <CheckCircle2 className="h-3 w-3" />
              已完成
            </span>
          ) : course.tags && course.tags.length > 0 ? (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {course.tags[0]}
            </span>
          ) : null}
        </div>

        <CardTitle className="mt-4 line-clamp-2 transition group-hover:text-primary-700 dark:group-hover:text-primary-300">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 flex-1">
          {course.description}
        </CardDescription>

        {/* 进度条 */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {total} 章
            </span>
            <span className="font-mono">
              {ready ? `${completed} / ${total}` : `-- / ${total}`}
            </span>
          </div>
          <ProgressBar value={percent} />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </span>
          {ready && percent > 0 && (
            <span className="font-mono text-primary-600 dark:text-primary-400">
              {percent}%
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
