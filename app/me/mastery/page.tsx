/** /me/mastery — 知识点掌握度雷达图 */
import { Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateMastery } from "@/lib/mastery";
import { MasteryClient } from "@/components/mastery/MasteryRadar";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "知识点掌握度 · ML 学习站",
  description: "雷达图可视化你的机器学习知识点掌握度, 自动识别知识盲点",
};

export default async function MasteryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/?next=/me/mastery/");

  const report = await calculateMastery(user.id);

  return (
    <div className="container max-w-6xl py-8 sm:py-12">
      {/* 头部 */}
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
          <Target className="h-3.5 w-3.5" />
          <span>知识点掌握度 (v19.8)</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
          {user.displayName || user.email.split("@")[0]}, 你的学习画像
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          基于 {report.total.chapters} 个章节的学习进度自动生成。雷达图各维度按 level 加权平均。
        </p>
      </div>

      {report.total.completedChapters === 0 && report.total.inProgressChapters === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <Target className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-700" />
          <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-50">
            还没有学习数据
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            开始你的第一门课程, 这里会自动生成画像
          </p>
          <a
            href="/courses/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            浏览课程
          </a>
        </div>
      ) : (
        <MasteryClient
          overall={report.overall}
          byLevel={report.byLevel}
          courses={report.courses}
          blindSpots={report.blindSpots}
          strengths={report.strengths}
          total={report.total}
        />
      )}
    </div>
  );
}
