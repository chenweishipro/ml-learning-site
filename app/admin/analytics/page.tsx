import { BarChart3, TrendingUp, Users, MessageSquare, GitPullRequest, Award, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getAdminAnalytics } from "@/lib/admin-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "学习数据看板 · Admin" };

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return (
      <div className="container py-12 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">需要管理员权限。</p>
        <Link href="/admin/" className="mt-4 inline-block text-primary-700 hover:underline">返回</Link>
      </div>
    );
  }
  const data = await getAdminAnalytics();

  const stats = [
    { label: "总用户", value: data.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "7 日活跃", value: data.activeUsersLast7d, icon: Activity, color: "text-emerald-600" },
    { label: "30 日活跃", value: data.activeUsersLast30d, icon: TrendingUp, color: "text-amber-600" },
    { label: "学习章节", value: data.totalProgress, icon: Award, color: "text-rose-600" },
    { label: "总学习 (小时)", value: Math.round(data.totalMinutes / 60), icon: Clock, color: "text-violet-600" },
    { label: "学习 sessions", value: data.totalSessions, icon: BarChart3, color: "text-cyan-600" },
    { label: "评论", value: data.totalComments, icon: MessageSquare, color: "text-indigo-600" },
    { label: "内容提议", value: data.totalProposals, icon: GitPullRequest, color: "text-pink-600" },
  ];

  const maxWeekday = Math.max(1, ...data.weekday.map((w) => w.minutes));
  const maxHourly = Math.max(1, ...data.hourly.map((h) => h.minutes));

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
          <BarChart3 className="h-3 w-3" />
          Admin · 学习数据看板
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">平台学习数据</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">所有用户、章节、贡献的总体情况</p>
      </div>

      {/* 总览 stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <Icon className={`h-4 w-4 ${s.color}`} />
              <div className="mt-1 text-xl font-bold tabular-nums">{s.value.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 课程 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-lg font-semibold">课程总览</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-neutral-500">
                <tr>
                  <th className="pb-2 text-left">课程</th>
                  <th className="pb-2 text-right">学习者</th>
                  <th className="pb-2 text-right">小时</th>
                  <th className="pb-2 text-right">平均完成</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data.courses.map((c) => (
                  <tr key={c.slug}>
                    <td className="py-2">
                      <Link href={`/courses/${c.slug}/`} className="text-primary-700 hover:underline dark:text-primary-300">
                        {c.title}
                      </Link>
                      <div className="text-[10px] text-neutral-500">{c.chapterCount} 章</div>
                    </td>
                    <td className="text-right tabular-nums">{c.uniqueLearners}</td>
                    <td className="text-right tabular-nums">{c.totalMinutes}</td>
                    <td className="text-right tabular-nums">
                      <span className={c.completionRate > 50 ? "text-emerald-600" : c.completionRate > 10 ? "text-amber-600" : "text-neutral-500"}>
                        {c.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 热门章节 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-lg font-semibold">热门章节 Top 10</h2>
          <ul className="space-y-2">
            {data.topChapters.length === 0 ? (
              <li className="text-sm text-neutral-500">暂无数据</li>
            ) : (
              data.topChapters.map((c, i) => (
                <li key={`${c.courseSlug}/${c.chapterSlug}`} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs font-medium text-neutral-500 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/courses/${c.courseSlug}/${c.chapterSlug}/`}
                      className="truncate text-neutral-900 hover:text-primary-700 dark:text-neutral-100"
                    >
                      {c.title}
                    </Link>
                    <div className="text-[10px] text-neutral-500">{c.courseSlug}</div>
                  </div>
                  <span className="text-xs text-neutral-500 tabular-nums">{c.sessions} 次</span>
                  <span className="w-12 text-right text-xs font-medium tabular-nums">{c.minutes}h</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* 周几高峰 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-lg font-semibold">一周学习分布</h2>
          <div className="flex h-40 items-end gap-2">
            {data.weekday.map((w) => {
              const h = (w.minutes / maxWeekday) * 100;
              return (
                <div key={w.dow} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full text-center text-[10px] tabular-nums text-neutral-500">{w.minutes}</div>
                  <div className="w-full rounded-t bg-primary-500" style={{ height: `${Math.max(2, h)}%` }} />
                  <div className="text-[10px] text-neutral-600">{WEEKDAYS[w.dow]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24 小时分布 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-lg font-semibold">24 小时学习分布 (UTC)</h2>
          <div className="flex h-40 items-end gap-1">
            {data.hourly.map((h) => {
              const v = (h.minutes / maxHourly) * 100;
              return (
                <div key={h.hour} className="flex flex-1 flex-col items-center gap-1" title={`${h.hour}:00 - ${h.minutes} 分钟`}>
                  <div className="w-full rounded-t bg-emerald-500" style={{ height: `${Math.max(2, v)}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
            <span>0时</span><span>6时</span><span>12时</span><span>18时</span><span>23时</span>
          </div>
        </div>

        {/* 贡献者 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Top 10 贡献者</h2>
          {data.topContributors.length === 0 ? (
            <p className="text-sm text-neutral-500">暂无贡献者</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th className="pb-2 text-left">用户</th>
                    <th className="pb-2 text-right">完成章节</th>
                    <th className="pb-2 text-right">sessions</th>
                    <th className="pb-2 text-right">评论</th>
                    <th className="pb-2 text-right">提议</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {data.topContributors.map((u) => (
                    <tr key={u.userId}>
                      <td className="py-2">
                        <div className="font-medium">{u.displayName ?? u.email.split("@")[0]}</div>
                        <div className="text-[10px] text-neutral-500">{u.email}</div>
                      </td>
                      <td className="text-right tabular-nums">{u.progress}</td>
                      <td className="text-right tabular-nums">{u.sessions}</td>
                      <td className="text-right tabular-nums">{u.comments}</td>
                      <td className="text-right tabular-nums">{u.proposals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
