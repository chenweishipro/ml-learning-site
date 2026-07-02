"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Search, SlidersHorizontal, X } from "lucide-react";
import type { CourseMeta, Level } from "@/content/courses/_index";
import { LEVEL_META, cn } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const LEVEL_OPTIONS: { value: Level | "all"; label: string }[] = [
  { value: "all", label: "全部难度" },
  { value: "beginner", label: "入门" },
  { value: "intermediate", label: "进阶" },
  { value: "advanced", label: "高级" },
];

export interface CourseExplorerProps {
  courses: CourseMeta[];
  tags: string[];
}

export function CourseExplorer({ courses, tags }: CourseExplorerProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level | "all">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (level !== "all" && c.level !== level) return false;
      if (activeTag && !c.tags?.includes(activeTag)) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [courses, query, level, activeTag]);

  return (
    <div className="space-y-8">
      {/* 筛选条 */}
      <div className="rounded-lg bg-white dark:bg-neutral-900 dark:bg-neutral-900 p-4 ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-soft sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="relative block">
            <span className="sr-only">搜索课程</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="按课程名、简介或标签搜索…"
              className="h-10 w-full rounded-md border border-neutral-200 bg-white dark:bg-neutral-900 dark:bg-neutral-900 pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <SlidersHorizontal className="h-4 w-4 text-neutral-400" />
            <span className="text-xs">筛选</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLevel(opt.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition ring-1",
                level === opt.value
                  ? "bg-primary-600 text-white ring-primary-600"
                  : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 ring-neutral-200 dark:ring-neutral-800 hover:ring-primary-300 dark:ring-primary-700"
              )}
            >
              {opt.label}
            </button>
          ))}

          {tags.length > 0 && (
            <>
              <span aria-hidden className="mx-1 h-4 w-px bg-neutral-200" />
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs transition ring-1",
                    activeTag === t
                      ? "bg-accent-500 text-white ring-accent-500"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 ring-neutral-200 dark:ring-neutral-800 hover:ring-accent-300"
                  )}
                >
                  #{t}
                </button>
              ))}
              {activeTag && (
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className="ml-1 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-200"
                >
                  <X className="h-3.5 w-3.5" />
                  清除
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 结果 */}
      <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
        <span>
          {courses.length === 0
            ? "暂无课程"
            : `共 ${filtered.length} / ${courses.length} 门课程`}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseGridCard key={course.slug} course={course} />
          ))}
        </div>
      ) : (
        courses.length > 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white dark:bg-neutral-900 dark:bg-neutral-900 p-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
            没有符合条件的课程, 试试调整搜索词或难度筛选。
          </div>
        )
      )}
    </div>
  );
}

function CourseGridCard({ course }: { course: CourseMeta }) {
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
          <Badge variant="neutral">{course.chapters.length} 章</Badge>
        </div>

        <CardTitle className="mt-4 line-clamp-2 group-hover:text-primary-700 transition dark:group-hover:text-primary-300">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 flex-1">
          {course.description}
        </CardDescription>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.chapters.length} 章节
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </span>
        </div>

        {course.tags && course.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {course.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="neutral">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
