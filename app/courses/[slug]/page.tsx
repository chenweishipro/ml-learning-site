import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap, User } from "lucide-react";
import { getAllCoursesSync } from "@/lib/content-overrides";
import { getCourseWithOverrides } from "@/lib/content-overrides";
import { LEVEL_META, cn } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShareButton } from "@/components/share-button";

interface Params {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return getAllCoursesSync().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const course = await getCourseWithOverrides(params.slug);
  if (!course) return { title: "课程未找到" };
  return {
    title: course.title,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: Params) {
  const course = await getCourseWithOverrides(params.slug);
  if (!course) notFound();

  const firstChapter = course.chapters[0];

  return (
    <div>
      {/* 课程头部 */}
      <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800/60 bg-gradient-hero">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
        >
          <div className="absolute left-1/2 top-0 h-[320px] w-[680px] -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl" />
        </div>

        <div className="container py-14 sm:py-20">
          <div className="mb-6 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Link href="/courses" className="hover:text-primary-700 dark:text-primary-300">
              课程目录
            </Link>
            <span aria-hidden>/</span>
            <span className="text-neutral-900 dark:text-neutral-50">{course.title}</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                    LEVEL_META[course.level].classes
                  )}
                >
                  {LEVEL_META[course.level].label}
                </span>
                {course.tags?.map((t) => (
                  <Badge key={t} variant="neutral">
                    {t}
                  </Badge>
                ))}
              </div>

              <h1 className="mt-4 text-display-sm font-bold tracking-tight sm:text-display-md">
                {course.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-lg">
                {course.description}
              </p>

              <div className="mt-5">
                <ShareButton title={course.title} text={course.description} variant="primary" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary-500" />
                  总时长 {course.duration}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary-500" />
                  {course.chapters.length} 个章节
                </span>
                {course.author && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary-500" />
                    {course.author}
                  </span>
                )}
              </div>

              {firstChapter && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/courses/${course.slug}/${firstChapter.slug}`}
                    className="group inline-flex h-11 items-center gap-2 rounded-md bg-primary-600 px-5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
                  >
                    开始学习 · {firstChapter.title}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              )}
            </div>

            <Card className="self-start p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                你将学到
              </h2>
              <ul className="mt-3 space-y-2.5">
                {(course.tags ?? []).map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-500" />
                    <span>围绕「{t}」主题展开的系统化训练</span>
                  </li>
                ))}
                {(!course.tags || course.tags.length === 0) && (
                  <li className="text-sm text-neutral-500 dark:text-neutral-400">
                    本课程暂无额外标签描述。
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* 章节目录 */}
      <section className="container py-12 sm:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">章节目录</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              共 {course.chapters.length} 章, 建议按顺序学习。
            </p>
          </div>
        </div>

        {course.chapters.length === 0 ? (
          <EmptyChapters slug={course.slug} />
        ) : (
          <ol className="space-y-3">
            {course.chapters.map((chapter, idx) => (
              <li key={chapter.slug}>
                <Link
                  href={`/courses/${course.slug}/${chapter.slug}`}
                  className="group block"
                >
                  <Card hoverable className="flex items-start gap-4 p-5 sm:p-6">
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-md bg-primary-50 font-semibold text-primary-700 dark:text-primary-300 ring-1 ring-primary-100">
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="group-hover:text-primary-700 dark:text-primary-300 transition">
                          {chapter.title}
                        </CardTitle>
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <Clock className="h-3.5 w-3.5" />
                          {chapter.duration}
                        </span>
                      </div>
                      <CardDescription className="mt-1">
                        {chapter.description}
                      </CardDescription>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
                  </Card>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function EmptyChapters({ slug }: { slug: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white dark:bg-neutral-900 dark:bg-neutral-900 p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-600 ring-1 ring-primary-100">
        <GraduationCap className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">章节未填充</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        请在 <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[0.85em]">_index.ts</code> 的
        <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[0.85em]">{slug}</code>
        课程下追加 <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[0.85em]">chapters</code> 数组,
        并在 <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[0.85em]">content/courses/{slug}/</code> 放置对应 MDX。
      </p>
    </div>
  );
}
