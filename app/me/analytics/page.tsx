// /me/analytics — 个人学习分析 dashboard
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLearningAnalytics } from "@/lib/analytics";
import { KPICards } from "@/components/analytics/KPICards";
import { StudyCurve } from "@/components/analytics/StudyCurve";
import { WeekdayChart } from "@/components/analytics/WeekdayChart";
import { CourseProgress } from "@/components/analytics/CourseProgress";
import { RecentChapters } from "@/components/analytics/RecentChapters";
import { Insights } from "@/components/analytics/Insights";
import { YearHeatmap } from "@/components/YearHeatmap";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/?next=/me/analytics/");

  const data = await getLearningAnalytics(user.id);

  return (
    <div className="min-h-screen bg-neutral-50/40 dark:bg-neutral-950/40">
      {/* Hero */}
      <div className="border-b border-neutral-200 bg-gradient-to-br from-primary-50 via-white to-purple-50/50 dark:border-neutral-800 dark:from-primary-950/30 dark:via-neutral-950 dark:to-purple-950/30">
        <div className="container py-8 lg:py-10">
          <Link
            href="/me/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-600 transition hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回个人中心
          </Link>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-soft">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl">
                我的学习分析
              </h1>
              <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                {user.displayName ?? user.email ?? "同学"} 的 30 天学习画像
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container space-y-6 py-6 lg:py-8">
        {/* 4 个 KPI */}
        <KPICards kpi={data.kpi} />

        {/* 折线 + 周内 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StudyCurve daily={data.daily} />
          </div>
          <div>
            <WeekdayChart data={data.weekday} />
          </div>
        </div>

        {/* 热力图 */}
        <YearHeatmap />

        {/* 课程进度 + 最近学习 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CourseProgress courses={data.courses} />
          </div>
          <div className="space-y-6">
            <RecentChapters items={data.recentChapters} />
            <Insights
              bestDay={data.insights.bestDay}
              streak={data.kpi.streak}
              completionRate={data.kpi.completionRate}
              activeDays={data.kpi.activeDays}
            />
          </div>
        </div>

        {/* 底部引语 */}
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-primary-50/50 via-white to-purple-50/30 p-6 dark:border-neutral-800 dark:from-primary-950/20 dark:via-neutral-900 dark:to-purple-950/20">
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            💡 <span className="font-medium text-neutral-800 dark:text-neutral-200">数据每 5 分钟更新</span> ·
            来自 {data.courses.length} 门课程 · {data.kpi.totalChapters} 章 · 你已经完成 {data.kpi.completedChapters} 章
          </p>
        </div>
      </div>
    </div>
  );
}