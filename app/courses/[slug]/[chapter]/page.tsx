import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import {
  getAllCoursesSync,
  getChapterWithOverrides,
  getCourseWithOverrides,
} from "@/lib/content-overrides";
import { getChapterNeighbors } from "@/lib/content";
import { getQuiz } from "@/lib/quizzes";
import { ChapterSidebar } from "./ChapterSidebar";
import { MDXContent } from "./MDXContent";
import { ChapterProgressButton } from "@/components/progress-tracker";
import { Quiz } from "@/components/quiz";

interface Params {
  params: { slug: string; chapter: string };
}

export const dynamic = "force-dynamic";

/** 静态生成所有合法 (course, chapter) 组合 */
export async function generateStaticParams() {
  const params: { slug: string; chapter: string }[] = [];
  for (const c of getAllCoursesSync()) {
    for (const ch of c.chapters) {
      params.push({ slug: c.slug, chapter: ch.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getChapterWithOverrides(params.slug, params.chapter);
  if (!data) return { title: "章节未找到" };
  return {
    title: data.meta.title,
    description: data.meta.description,
  };
}

export default async function ChapterPage({ params }: Params) {
  const course = await getCourseWithOverrides(params.slug);
  if (!course) notFound();

  const data = await getChapterWithOverrides(params.slug, params.chapter);
  if (!data) notFound();

  const { prev, next, index, total } = getChapterNeighbors(
    params.slug,
    params.chapter
  );

  // 进度 = 已完成章节数 / 总章节数 (1-based 索引 -> 进度百分比)
  const progress = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="container py-8 lg:py-10">
      {/* 面包屑 */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/courses" className="hover:text-primary-700 dark:text-primary-300">
          课程
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/courses/${course.slug}`}
          className="hover:text-primary-700 dark:text-primary-300 line-clamp-1"
        >
          {course.title}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-900 dark:text-neutral-50 line-clamp-1">
          {data.meta.title}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* 左侧侧边栏 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ChapterSidebar
            courseSlug={course.slug}
            courseTitle={course.title}
            chapters={course.chapters}
            currentSlug={data.meta.slug}
            progress={progress}
          />
        </aside>

        {/* 右侧内容 */}
        <article className="min-w-0">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {data.meta.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {data.meta.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {data.meta.duration}
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                第 {index + 1} / {total} 章
              </span>
              <ChapterProgressButton courseSlug={params.slug} chapterSlug={params.chapter} />
            </div>
          </header>

          <MDXContent source={data.content} />

          {/* 章末小测验 (如果该章有题) */}
          {(() => {
            const questions = getQuiz(params.slug, params.chapter);
            if (questions.length === 0) return null;
            return (
              <Quiz
                title="章末小测验"
                description={`检验你对《${data.meta.title}》的掌握程度。`}
                questions={questions}
                chapterId={`${params.slug}/${params.chapter}`}
              />
            );
          })()}

          {/* 上下章导航 */}
          <nav className="mt-12 grid gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-8 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/courses/${course.slug}/${prev.slug}`}
                className="group rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 dark:bg-neutral-900 p-4 transition hover:border-primary-300 dark:hover:border-primary-700 dark:hover:border-primary-300 hover:shadow-soft"
              >
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  上一章
                </span>
                <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-50 group-hover:text-primary-700 dark:text-primary-300">
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
            {next ? (
              <Link
                href={`/courses/${course.slug}/${next.slug}`}
                className="group rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 dark:bg-neutral-900 p-4 text-right transition hover:border-primary-300 dark:hover:border-primary-700 dark:hover:border-primary-300 hover:shadow-soft"
              >
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  下一章
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-50 group-hover:text-primary-700 dark:text-primary-300">
                  {next.title}
                </p>
              </Link>
            ) : (
              <Link
                href={`/courses/${course.slug}`}
                className="group rounded-lg border border-primary-200 bg-primary-50/60 p-4 text-right transition hover:border-primary-300 dark:hover:border-primary-700 dark:hover:border-primary-300 hover:bg-primary-50 dark:bg-primary-950/30"
              >
                <span className="inline-flex items-center gap-1 text-xs text-primary-600">
                  课程完成 · 回到
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <p className="mt-1 text-sm font-medium text-primary-800">
                  课程首页
                </p>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
