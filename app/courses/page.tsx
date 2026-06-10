import type { Metadata } from "next";
import { BookOpen, GraduationCap, Search, SlidersHorizontal } from "lucide-react";
import { getAllCoursesWithOverrides } from "@/lib/content-overrides";
import { CourseExplorer } from "./CourseExplorer";
import { CoursesHero } from "./CoursesHero";

export const metadata: Metadata = {
  title: "课程目录",
  description: "浏览全部机器学习课程, 按难度与主题筛选你的学习路径。",
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllCoursesWithOverrides();
  // 从课程中提取全部标签, 用于筛选器
  const tagSet = new Set<string>();
  courses.forEach((c) => c.tags?.forEach((t) => tagSet.add(t)));
  const tags = Array.from(tagSet).sort();

  return (
    <div className="bg-gradient-hero/40 min-h-[60vh]">
      <CoursesHero count={courses.length} />

      <section className="container py-10">
        <CourseExplorer courses={courses} tags={tags} />
      </section>

      {courses.length === 0 && <CoursesEmptyState />}
    </div>
  );
}

function CoursesEmptyState() {
  return (
    <section className="container pb-20">
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-neutral-300 bg-white dark:bg-neutral-900 dark:bg-neutral-900 p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-600 ring-1 ring-primary-100">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          课程数据尚未填充
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          请在
          <code className="mx-1 rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[0.85em]">
            content/courses/_index.ts
          </code>
          中追加课程元数据, 并在
          <code className="mx-1 rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[0.85em]">
            content/courses/&lt;slug&gt;/&lt;chapter&gt;.mdx
          </code>
          放置对应章节文件, 课程卡片会自动出现。
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <Search className="h-3.5 w-3.5" /> 搜索框已就绪
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> 难度 / 标签筛选已就绪
          </span>
        </div>
      </div>
    </section>
  );
}
