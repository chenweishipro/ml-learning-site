"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Gift,
  User,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  GitPullRequestArrow,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { NextStepsCard } from "@/components/NextStepsCard";
import { YearHeatmap } from "@/components/YearHeatmap";
import type { Recommendation } from "@/lib/recommend";

interface CourseProgress {
  slug: string;
  title: string;
  totalChapters: number;
  completedChapters: number;
  completionRate: number;
}

interface HeatmapDay {
  date: string;
  minutes: number;
  completed: number;
}

interface Certificate {
  courseSlug: string;
  title: string;
  issuedAt: string;
  serialNo: string;
}

interface RecentActivity {
  type: string;
  title: string;
  detail: string;
  at: string;
}

interface Summary {
  totalChapters: number;
  completedChapters: number;
  inProgressChapters: number;
  completionRate: number;
  courses: CourseProgress[];
  memberSinceDays: number;
  totalStudyMinutes: number;
  streak: number;
  heatmap: HeatmapDay[];
  proposalsSubmitted: number;
  proposalsMerged: number;
  certificates: Certificate[];
  recent: RecentActivity[];
}

export default function MePage() {
  const { user, ready } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, recRes, wrongRes] = await Promise.all([
        fetch("/api/study/summary/", { credentials: "include" }),
        fetch("/api/recommend/?limit=5", { credentials: "include" }).catch(() => null),
        fetch("/api/quiz/wrong/?resolved=false&limit=1", { credentials: "include" }).catch(() => null),
      ]);
      const data = await summaryRes.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setSummary(data.data.summary);
      if (recRes && recRes.ok) {
        const rj = await recRes.json();
        if (rj.ok) setRecs(rj.data);
      }
      if (wrongRes && wrongRes.ok) {
        const wj = await wrongRes.json();
        if (wj.ok) setWrongCount(wj.data.items.length > 0 ? 100 : 0); // 简化: 只显示有没有
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  if (!ready) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800/40 dark:bg-amber-950/30">
          <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-300">请先登录</h1>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            登录后查看你的学习数据、证书、贡献记录。
          </p>
        </div>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className="container py-12">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载学习数据中...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-10 sm:py-12">
      {/* 头部 */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
            <Sparkles className="h-3 w-3" />
            个人中心
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {user.displayName ?? user.email.split("@")[0]} 的学习
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            你加入 ML 学习站已经 <strong>{summary.memberSinceDays}</strong> 天
          </p>
        </div>
        <Link
          href="/courses/"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          <Compass className="h-4 w-4" />
          继续学习
        </Link>
      </div>

      {/* 总览卡片 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="已完成章节"
          value={summary.completedChapters}
          sub={`/ ${summary.totalChapters} 章`}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="总体完成度"
          value={`${summary.completionRate.toFixed(1)}%`}
          sub={`${summary.courses.filter((c) => c.completionRate === 100).length} 门已学完`}
          color="primary"
        />
        <StatCard
          icon={Clock}
          label="学习时长"
          value={`${summary.totalStudyMinutes}`}
          sub="分钟 (近 30 天)"
          color="amber"
        />
        <StatCard
          icon={Flame}
          label="连续打卡"
          value={summary.streak}
          sub={summary.streak > 0 ? "天 🔥" : "今日未学习"}
          color="rose"
        />
      </div>

      {/* 主体: 两列 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左 2 列 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 学习热力图 */}
          <Card title="学习活动" icon={Calendar}>
            <Heatmap data={summary.heatmap} />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span>少</span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-3 w-3 rounded-sm",
                      i === 0 && "bg-neutral-100 dark:bg-neutral-800",
                      i === 1 && "bg-emerald-100 dark:bg-emerald-900/40",
                      i === 2 && "bg-emerald-300 dark:bg-emerald-700/60",
                      i === 3 && "bg-emerald-500",
                      i === 4 && "bg-emerald-700"
                    )}
                  />
                ))}
              </div>
              <span>多</span>
              <span className="ml-3">近 30 天 · 共 {summary.totalStudyMinutes} 分钟</span>
            </div>
          </Card>

          {/* 快捷入口 */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/me/learning-path/"
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-700"
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-neutral-900 group-hover:text-indigo-700 dark:text-neutral-50 dark:group-hover:text-indigo-300">
                  学习路径
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
                  定制路线 · 智能裁剪已完成
                </p>
              </div>
            </Link>

            <Link
              href="/me/schedule/"
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700"
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-neutral-900 group-hover:text-emerald-700 dark:text-neutral-50 dark:group-hover:text-emerald-300">
                  学习周历 (v19.6)
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
                  周计划 · 每天打卡完成
                </p>
              </div>
            </Link>

            <Link
              href="/me/analytics/"
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-700"
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-neutral-900 group-hover:text-indigo-700 dark:text-neutral-50 dark:group-hover:text-indigo-300">
                  学习分析
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
                  热力图、曲线、个性化建议
                </p>
              </div>
            </Link>

            <Link
              href="/me/wrong-answers/"
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-red-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-red-700"
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-neutral-900 group-hover:text-red-700 dark:text-neutral-50 dark:group-hover:text-red-300">错题本</div>
                <div className="text-xs text-neutral-500">复习 Quiz 错题</div>
              </div>
            </Link>

            <Link
              href="/me/edit/"
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                  编辑个人资料
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
                  昵称、简介、头像
                </p>
              </div>
            </Link>

            <Link
              href="/me/invite/"
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-rose-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-rose-700"
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                <Gift className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-neutral-900 group-hover:text-rose-700 dark:text-neutral-50 dark:group-hover:text-rose-300">
                  邀请好友
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
                  生成邀请码, 双方得徽章
                </p>
              </div>
            </Link>

            <Link
              href="/me/settings/"
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-violet-700"
            >
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-neutral-900 group-hover:text-violet-700 dark:text-neutral-50 dark:group-hover:text-violet-300">
                  账号设置
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400">
                  邮件简报、通知偏好
                </p>
              </div>
            </Link>
          </div>

          {/* 下一步学什么 — 智能推荐 */}
          <NextStepsCard recs={recs} />
          <YearHeatmap year={new Date().getFullYear()} />

          {/* 课程进度 */}
          <Card title="课程进度" icon={BookOpen}>
            <div className="space-y-3">
              {summary.courses.map((c) => (
                <Link
                  key={c.slug}
                  href={`/courses/${c.slug}/`}
                  className="group block"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                      {c.title}
                    </span>
                    <span className="flex items-center gap-2 tabular-nums text-xs text-neutral-500">
                      <span>
                        {c.completedChapters} / {c.totalChapters}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          c.completionRate === 100
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : c.completionRate > 0
                            ? "bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300"
                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                        )}
                      >
                        {c.completionRate.toFixed(0)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/60 dark:bg-neutral-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        c.completionRate === 100
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : "bg-gradient-to-r from-primary-600 to-primary-500"
                      )}
                      style={{ width: `${c.completionRate}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* 最近活动 */}
          {summary.recent.length > 0 && (
            <Card title="最近活动" icon={Clock}>
              <ol className="space-y-2.5">
                {summary.recent.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-neutral-50">
                          {r.title}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(r.at).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {r.detail}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* 右 1 列 */}
        <div className="space-y-6">
          {/* 学习计划 / 每日目标 */}
          <Card title="每日目标" icon={Target}>
            <DailyGoalSection
              summary={summary}
              onUpdate={load}
            />
          </Card>

          {/* 证书 */}
          <Card title="我的证书" icon={Trophy}>
            {summary.certificates.length === 0 ? (
              <div className="rounded-md border border-dashed border-neutral-300 p-4 text-center dark:border-neutral-700">
                <Award className="mx-auto h-6 w-6 text-neutral-300" />
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  学完一门课程后, 这里会显示证书
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {summary.certificates.map((c) => (
                  <li
                    key={c.serialNo}
                    className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/40 p-2.5 dark:border-amber-800/40 dark:bg-amber-950/20"
                  >
                    <Award className="h-4 w-4 flex-shrink-0 text-amber-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-amber-900 dark:text-amber-300">
                        {c.title}
                      </div>
                      <div className="truncate text-[10px] text-amber-700/80 dark:text-amber-400/80">
                        {c.serialNo} · {new Date(c.issuedAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <Link
                      href={`/certificates/${c.serialNo}/`}
                      className="text-amber-700 hover:text-amber-800 dark:text-amber-300"
                      title="查看证书"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 贡献 */}
          <Card title="我的贡献" icon={GitPullRequestArrow}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">提交提案</span>
                <span className="font-mono font-medium text-neutral-900 dark:text-neutral-50">
                  {summary.proposalsSubmitted}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">被采纳</span>
                <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                  {summary.proposalsMerged}
                </span>
              </div>
              <Link
                href="/proposals/"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary-700 hover:underline dark:text-primary-400"
              >
                查看我的提案
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
  sub?: string;
  color: "emerald" | "primary" | "amber" | "rose";
}) {
  const COLOR_MAP: Record<typeof color, string> = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/50",
    primary: "bg-primary-50 text-primary-600 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-400 dark:ring-primary-800/50",
    amber: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/50",
    rose: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/50",
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <span className={cn("grid h-5 w-5 place-items-center rounded ring-1", COLOR_MAP[color])}>
          <Icon className="h-3 w-3" />
        </span>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{sub}</div>}
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BookOpen;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
        <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Heatmap({ data }: { data: HeatmapDay[] }) {
  // 找最大分钟数用于分级
  const max = Math.max(1, ...data.map((d) => d.minutes));
  return (
    <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
      {data.map((d) => {
        const intensity = d.minutes === 0 ? 0 : Math.ceil((d.minutes / max) * 4);
        return (
          <div
            key={d.date}
            title={`${d.date} · ${d.minutes} 分钟${d.completed ? ` · 标记完成 ${d.completed} 章` : ""}`}
            className={cn(
              "aspect-square rounded-sm transition hover:ring-1 hover:ring-primary-400",
              intensity === 0 && "bg-neutral-100 dark:bg-neutral-800",
              intensity === 1 && "bg-emerald-100 dark:bg-emerald-900/40",
              intensity === 2 && "bg-emerald-300 dark:bg-emerald-700/60",
              intensity === 3 && "bg-emerald-500",
              intensity >= 4 && "bg-emerald-700"
            )}
          />
        );
      })}
    </div>
  );
}

function DailyGoalSection({
  summary,
  onUpdate,
}: {
  summary: Summary;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(summary.courses[0]?.slug ?? "");
  const [dailyTarget, setDailyTarget] = useState(1);
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  // 今天学了多少?
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = summary.heatmap.find((h) => h.date === today);
  const todayCompleted = todayEntry?.completed ?? 0;

  async function loadPlan() {
    const res = await fetch("/api/study/plan/", { credentials: "include" });
    const data = await res.json();
    if (data.ok && data.data.plan) {
      setSelectedCourse(data.data.plan.courseSlug);
      setDailyTarget(data.data.plan.dailyTarget);
      if (data.data.plan.targetDate) {
        setTargetDate(new Date(data.data.plan.targetDate).toISOString().slice(0, 10));
      }
    }
  }
  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/study/plan/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseSlug: selectedCourse,
          dailyTarget,
          targetDate: targetDate || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setEditing(false);
        onUpdate();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {editing ? (
        <div className="space-y-2.5">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {summary.courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-600">每日</label>
            <input
              type="number"
              min={1}
              max={20}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              className="h-9 w-16 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <span className="text-xs text-neutral-600">章</span>
          </div>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              保存
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
              {todayCompleted}
            </span>
            <span className="text-xs text-neutral-500">
              章 (今日)
            </span>
          </div>
          {selectedCourse && (
            <div className="mt-1 text-xs text-neutral-500">
              课程: {summary.courses.find((c) => c.slug === selectedCourse)?.title}
            </div>
          )}
          <button
            onClick={() => setEditing(true)}
            className="mt-2 text-xs text-primary-700 hover:underline dark:text-primary-400"
          >
            {selectedCourse ? "调整目标" : "设定目标"}
          </button>
        </div>
      )}
    </div>
  );
}
