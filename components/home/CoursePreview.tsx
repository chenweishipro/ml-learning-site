import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";
import { courses, type CourseMeta } from "@/content/courses/_index";
import { LEVEL_META, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { CourseCardWithProgress } from "@/components/course-card-with-progress";

export function CoursePreview() {
  // 课程为空时, 展示明确的"待补充"占位
  if (courses.length === 0) {
    return <CoursePreviewEmpty />;
  }

  const preview = courses.slice(0, 4);

  return (
    <section className="bg-neutral-50/60 py-20 sm:py-24 dark:bg-neutral-950/40">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h2 className="text-display-sm font-bold tracking-tight">
              推荐课程
            </h2>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">
              精选几门覆盖数据处理、建模与深度学习的代表性课程, 开始你的机器学习之旅。
            </p>
          </div>
          <Link
            href="/courses"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
          >
            查看全部课程
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {preview.map((course) => (
            <CourseCardWithProgress key={course.slug} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: CourseMeta }) {
  return (
    <Link href={`/courses/${course.slug}`} className="group block">
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
          {course.tags && course.tags.length > 0 && (
            <span className="text-xs text-neutral-500">
              {course.tags[0]}
            </span>
          )}
        </div>

        <CardTitle className="mt-4 line-clamp-2 group-hover:text-primary-700 transition">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 flex-1">
          {course.description}
        </CardDescription>

        <div className="mt-5 flex items-center justify-between text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.chapters.length} 章
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function CoursePreviewEmpty() {
  return (
    <section className="bg-neutral-50/60 py-20 sm:py-24 dark:bg-neutral-950/40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-display-sm font-bold tracking-tight">推荐课程</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            课程内容由 content 任务在下一阶段补充, 现在先展示骨架。
          </p>
        </div>
        <div className="mt-10">
          <Card className="mx-auto max-w-2xl p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-100">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle className="mt-4">课程正在准备中</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-md">
              页面布局、卡片样式、跳转逻辑已经全部就绪, 一旦 content 任务添加
              <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.85em]">
                _index.ts
              </code>
              中的课程数据, 这里会自动渲染。
            </CardDescription>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Badge variant="primary">页面骨架</Badge>
              <Badge variant="accent">数据驱动</Badge>
              <Badge>响应式</Badge>
            </div>
            <Link
              href="/courses"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              前往课程页
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}
