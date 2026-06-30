import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Edit3, GitPullRequestArrow } from "lucide-react";
import {
  getAllCoursesSync,
  getChapterWithOverrides,
  getCourseWithOverrides,
} from "@/lib/content-overrides";
import { getChapterNeighbors } from "@/lib/content";
import { suggestRelated } from "@/lib/recommend";
import { RelatedChaptersCard } from "@/components/RelatedChaptersCard";
import { AISummaryCard } from "@/components/AISummaryCard";
import { getAISummary } from "@/lib/ai-summary";
import { getQuiz, getOrGenerateQuiz } from "@/lib/quizzes";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { extractToc } from "@/lib/toc";
import { ChapterSidebar } from "./ChapterSidebar";
import { MDXContent } from "./MDXContent";
import { ChapterProgressButton } from "@/components/progress-tracker";
import { ChapterPDFExport } from "@/components/chapter-pdf-export";
import { ChapterDownload } from "@/components/chapter-download";
import { ShareButton } from "@/components/share-button";
import { Quiz } from "@/components/quiz";
import { ChapterToc } from "@/components/chapter-toc";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { CommentSection } from "@/components/comments/CommentSection";
import { JsonLd, ChapterJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { LearningPathSuggestion } from "@/components/learning-path/LearningPathSuggestion";
import { ChapterAskBox } from "@/components/rag/ChapterAskBox";

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
  const [data, course] = await Promise.all([
    getChapterWithOverrides(params.slug, params.chapter),
    getCourseWithOverrides(params.slug),
  ]);
  if (!data) return { title: "章节未找到" };
  return {
    title: `${data.meta.title} · ${course?.title ?? "课程"} · ML 学习站`,
    description: data.meta.description,
    openGraph: {
      title: data.meta.title,
      description: data.meta.description,
      type: "article",
      url: `/courses/${params.slug}/${params.chapter}/`,
      siteName: "ML 学习站",
      locale: "zh_CN",
      images: [
        {
          url: `/courses/${params.slug}/${params.chapter}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${course?.title ?? ""} · ${data.meta.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.meta.title,
      description: data.meta.description,
      images: [`/courses/${params.slug}/${params.chapter}/opengraph-image`],
    },
  };
}

export default async function ChapterPage({ params }: Params) {
  const course = await getCourseWithOverrides(params.slug);
  if (!course) notFound();

  const data = await getChapterWithOverrides(params.slug, params.chapter);
  if (!data) notFound();
  const quizQuestions = await getOrGenerateQuiz(params.slug, params.chapter, 5);

  const { prev, next, index, total } = getChapterNeighbors(
    params.slug,
    params.chapter
  );

  // 进度 = 已完成章节数 / 总章节数 (1-based 索引 -> 进度百分比)
  const progress = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  // 提取目录 (VitePress 风格)
  const toc = await extractToc(data.content);

  // AI 摘要 (server-side 预先拿, 让 SSR 直接显示)
  const aiSummary = await getAISummary(params.slug, params.chapter, data.content).catch(() => null);

  // 是否显示"编辑此页"按钮
  const currentUser = await getCurrentUser();
  const canEdit = currentUser ? isAdmin(currentUser.role) : false;
  // 任何登录用户都可以"提议修改" (含 admin — admin 也可以走 PR 流程)
  const canPropose = !!currentUser;

  // 字数统计
  const wordCount = data.content.replace(/```[\s\S]*?```/g, "").length;

  return (
    <div className="container py-8 lg:py-10">
      {/* JSON-LD: Chapter (LearningResource) + Breadcrumb */}
      <JsonLd
        data={[
          ChapterJsonLd({ course, chapter: data.meta }),
          BreadcrumbJsonLd({
            items: [
              { name: "首页", url: "/" },
              { name: "课程", url: "/courses/" },
              { name: course.title, url: `/courses/${course.slug}/` },
              { name: data.meta.title, url: `/courses/${course.slug}/${data.meta.slug}/` },
            ],
          }),
        ]}
      />
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

      {/* 顶部元数据条 + "编辑此页" 按钮 (VitePress 风格) */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
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
            <span className="inline-flex items-center gap-1 tabular-nums">
              {wordCount.toLocaleString()} 字
            </span>
            <ChapterProgressButton courseSlug={params.slug} chapterSlug={params.chapter} />
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {canPropose && (
            <Link
              href={`/proposals/new/${params.slug}/${params.chapter}/`}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:border-primary-300 hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-950/50"
              title="提出修改建议, 由管理员审核后合并"
            >
              <GitPullRequestArrow className="h-3.5 w-3.5" />
              提议修改
            </Link>
          )}
          <ChapterPDFExport
            courseSlug={params.slug}
            courseTitle={course.title}
            chapterSlug={params.chapter}
            chapterTitle={data.meta.title}
          />
                <ChapterDownload courseSlug={params.slug} chapterSlug={params.chapter} chapterTitle={data.meta.title} />
                <ShareButton title={data.meta.title} text={data.meta.description ?? ""} variant="outline" />
          {canEdit && (
            <Link
              href={`/admin/courses/${params.slug}/chapters/${params.chapter}/`}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
              title="在管理后台编辑此章节"
            >
              <Edit3 className="h-3.5 w-3.5" />
              编辑此页
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr_220px]">
        {/* 左侧侧边栏: 课程章节列表 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ChapterSidebar
            courseSlug={course.slug}
            courseTitle={course.title}
            chapters={course.chapters}
            currentSlug={data.meta.slug}
            progress={progress}
          />
        </aside>

        {/* 中间内容 (VitePress 风格: 较窄的 max-width) */}
        <article className="min-w-0">
          <AISummaryCard
            courseSlug={params.slug}
            chapterSlug={params.chapter}
            initial={aiSummary}
          />
          <MDXContent source={data.content} />

          {/* 章末小测验 (静态题库优先, 无则 AI 生成) */}
          {quizQuestions.length > 0 && (
            <Quiz
              title="章末小测验"
              description={`检验你对《${data.meta.title}》的掌握程度。`}
              questions={quizQuestions}
              chapterId={`${params.slug}/${params.chapter}`}
            />
          )}

          {/* 上下章导航 (VitePress 风格) */}
          <nav className="mt-12 grid gap-3 border-t border-neutral-200 pt-8 sm:grid-cols-2 dark:border-neutral-800">
            {prev ? (
              <Link
                href={`/courses/${course.slug}/${prev.slug}`}
                className="group flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
              >
                <ArrowLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400 transition group-hover:-translate-x-0.5 group-hover:text-primary-600" />
                <div className="min-w-0">
                  <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    上一章
                  </span>
                  <p className="mt-1 truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                    {prev.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
            {next ? (
              <Link
                href={`/courses/${course.slug}/${next.slug}`}
                className="group flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-right transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    下一章
                  </span>
                  <p className="mt-1 truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                    {next.title}
                  </p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </Link>
            ) : (
              <Link
                href={`/courses/${course.slug}`}
                className="group flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50/60 p-4 text-right transition hover:border-primary-300 hover:bg-primary-50 dark:border-primary-800/50 dark:bg-primary-950/30 dark:hover:border-primary-700 dark:hover:bg-primary-950/50"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs uppercase tracking-wide text-primary-600">
                    课程完成
                  </span>
                  <p className="mt-1 truncate text-sm font-medium text-primary-800 dark:text-primary-300">
                    回到课程首页
                  </p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500 transition group-hover:translate-x-0.5" />
              </Link>
            )}
          </nav>

          {/* 学完这章, 你可能想看 — 关联章节推荐 */}
          <RelatedChaptersCard items={suggestRelated(params.slug, params.chapter, 3)} />

          {/* 推荐学习路径 (v19.4) */}
          <LearningPathSuggestion courseSlug={params.slug} />

          {/* 问问 AI (v19.5) */}
          <ChapterAskBox
            courseSlug={params.slug}
            chapterSlug={params.chapter}
            chapterTitle={data.meta.title || params.chapter}
          />

          {/* 评论区 */}
          <CommentSection
            scope="chapter"
            courseSlug={params.slug}
            chapterSlug={params.chapter}
            title="讨论区"
          />
        </article>

        {/* 右侧: 本页目录 + 笔记 */}
        <div className="space-y-4">
          <ChapterToc items={toc} />
          <NotesPanel courseSlug={params.slug} chapterSlug={params.chapter} />
        </div>
      </div>
    </div>
  );
}
