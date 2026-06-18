import Link from "next/link";
import { ArrowLeft, BookOpen, Trash2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAllCoursesSync } from "@/lib/content-overrides";
import { getQuiz } from "@/lib/quizzes";
import { WrongAnswersClient } from "./WrongAnswersClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "错题本 · ML 学习站",
  description: "复习答错的题目, 巩固薄弱知识点。",
};

export default async function WrongAnswersPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="container py-12 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">请先登录查看错题本。</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 text-primary-700 hover:underline">
          回到首页
        </Link>
      </div>
    );
  }

  const wrongItems = await prisma.quizWrong.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  // 把每条错题扩充成可重做的格式
  const enriched = wrongItems
    .map((w) => {
      const course = getAllCoursesSync().find((c) => c.slug === w.courseSlug);
      const chapter = course?.chapters.find((c) => c.slug === w.chapterSlug);
      if (!course || !chapter) return null;
      const quiz = getQuiz(w.courseSlug, w.chapterSlug);
      const question = quiz[w.questionIndex];
      if (!question) return null;
      return {
        id: w.id,
        resolved: w.resolved,
        questionIndex: w.questionIndex,
        updatedAt: w.updatedAt.toISOString(),
        course: { slug: w.courseSlug, title: course.title },
        chapter: { slug: w.chapterSlug, title: chapter.title },
        question: {
          text: question.question,
          options: question.options,
          userAnswer: w.userAnswer,
          correctAnswer: w.correctAnswer,
          explanation: question.explanation,
        },
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const unresolved = enriched.filter((e) => !e.resolved).length;

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Link href="/me" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300">
            <ArrowLeft className="h-3.5 w-3.5" />
            回到个人中心
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">错题本</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            复习你答错的 Quiz 题目, 巩固薄弱知识点。
            {unresolved > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800/50">
                <XCircle className="h-3 w-3" /> 未掌握 {unresolved}
              </span>
            )}
          </p>
        </div>
        {unresolved > 0 && (
          <form
            action="/api/quiz/wrong"
            method="POST"
            // 用 client form 调 DELETE
            id="mark-all-form"
          />
        )}
      </div>

      <WrongAnswersClient items={enriched} />
    </div>
  );
}
