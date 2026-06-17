import Link from "next/link";
import { ArrowLeft, Award, AlertTriangle, XCircle, CheckCircle2, TrendingUp, Users, BookOpen, MessageSquare, FileText, Clock, Brain } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getChapterQuality, getCourseQuality, getAIQuizCacheStats } from "@/lib/quality-report";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = { title: "章节质量报告 · Admin · ML 学习站" };

const STATUS_META = {
  ok: { label: "健康", classes: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50", icon: CheckCircle2 },
  warn: { label: "关注", classes: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50", icon: AlertTriangle },
  bad: { label: "问题", classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50", icon: XCircle },
};

export default async function QualityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/");
  if (!isAdmin(user.role)) {
    return (
      <div className="container max-w-2xl py-10">
        <h1 className="text-2xl font-bold">无权限</h1>
        <p className="mt-2 text-sm text-neutral-600">该页面仅管理员可访问。</p>
      </div>
    );
  }

  const [chapters, courses, aiCache] = await Promise.all([
    getChapterQuality(),
    getCourseQuality(),
    getAIQuizCacheStats(),
  ]);

  // 排序: bad > warn > ok, 同状态内按质量分升序
  const sorted = [...chapters].sort((a, b) => {
    const order = { bad: 0, warn: 1, ok: 2 } as const;
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.qualityScore - b.qualityScore;
  });

  const stats = {
    total: chapters.length,
    bad: chapters.filter((c) => c.status === "bad").length,
    warn: chapters.filter((c) => c.status === "warn").length,
    ok: chapters.filter((c) => c.status === "ok").length,
    avgScore: chapters.length > 0 ? chapters.reduce((s, c) => s + c.qualityScore, 0) / chapters.length : 0,
    totalWrong: chapters.reduce((s, c) => s + c.wrongAnswers, 0),
    totalNotes: chapters.reduce((s, c) => s + c.notesCount, 0),
    totalComments: chapters.reduce((s, c) => s + c.commentsCount, 0),
  };

  return (
    <div className="container max-w-6xl py-10">
      <Link href="/admin/" className="mb-3 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300">
        <ArrowLeft className="h-3.5 w-3.5" /> 后台
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
            <Award className="h-3 w-3" />
            章节质量报告
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">章节健康度分析</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            基于完成率、错题、笔记、评论、活跃度等 8 个维度打分
          </p>
        </div>
      </div>

      {/* 8 维全局统计 */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<BookOpen className="h-4 w-4" />} label="总章节" value={stats.total} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="平均分" value={stats.avgScore.toFixed(0)} accent />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="健康" value={stats.ok} />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="关注/问题" value={`${stats.warn} / ${stats.bad}`} warn={stats.bad > 0} />
        <Stat icon={<XCircle className="h-4 w-4" />} label="错题总数" value={stats.totalWrong} />
        <Stat icon={<FileText className="h-4 w-4" />} label="笔记总数" value={stats.totalNotes} />
        <Stat icon={<MessageSquare className="h-4 w-4" />} label="章节评论" value={stats.totalComments} />
        <Stat icon={<Brain className="h-4 w-4" />} label="AI 出题缓存" value={`${aiCache.totalCached} (${aiCache.totalSizeKB}KB)`} />
      </section>

      {/* 课程级别 */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-lg font-semibold">课程健康度</h2>
        <div className="space-y-2">
          {courses.sort((a, b) => a.avgQualityScore - b.avgQualityScore).map((c) => (
            <div key={c.slug} className="flex items-center gap-3 rounded-md border border-neutral-200 p-2.5 dark:border-neutral-800">
              <div className="flex-1 min-w-0">
                <Link href={`/courses/${c.slug}/`} className="text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300">
                  {c.title}
                </Link>
                <div className="mt-0.5 text-[10px] text-neutral-500">
                  {c.chaptersCount} 章 · {c.okCount} 健康 / {c.warnCount} 关注 / {c.badCount} 问题
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={cn(
                      "h-full",
                      c.avgQualityScore >= 80 ? "bg-emerald-500" : c.avgQualityScore >= 60 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${c.avgQualityScore}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-medium tabular-nums">{c.avgQualityScore.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 章节级别 (按状态分组) */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">章节详情 (按健康度排序)</h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/50">
                <th className="px-3 py-2 font-medium">章节</th>
                <th className="px-3 py-2 font-medium">状态</th>
                <th className="px-3 py-2 text-right font-medium">质量</th>
                <th className="px-3 py-2 text-right font-medium">完成率</th>
                <th className="px-3 py-2 text-right font-medium">错题</th>
                <th className="px-3 py-2 text-right font-medium">笔记</th>
                <th className="px-3 py-2 text-right font-medium">评论</th>
                <th className="px-3 py-2 text-right font-medium">活跃30d</th>
                <th className="px-3 py-2 font-medium">提示</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const meta = STATUS_META[c.status];
                const Icon = meta.icon;
                return (
                  <tr key={`${c.courseSlug}/${c.chapterSlug}`} className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
                    <td className="px-3 py-2">
                      <Link
                        href={`/courses/${c.courseSlug}/${c.chapterSlug}/`}
                        className="line-clamp-1 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300"
                        title={c.chapterTitle}
                      >
                        {c.chapterTitle}
                      </Link>
                      <div className="text-[10px] text-neutral-500">{c.courseSlug}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1", meta.classes)}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{c.qualityScore.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {c.totalUsers > 0 ? `${(c.completionRate * 100).toFixed(0)}%` : "—"}
                      <div className="text-[10px] text-neutral-500">{c.completedUsers}/{c.totalUsers}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.wrongAnswers}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.notesCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.commentsCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.active30d}</td>
                    <td className="px-3 py-2 max-w-[200px] text-[10px] text-neutral-500">
                      {c.reasons.length > 0 ? c.reasons.join(" · ") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, accent, warn }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border p-3",
      warn ? "border-rose-200 bg-rose-50/50 dark:border-rose-800/40 dark:bg-rose-950/20" :
      accent ? "border-primary-200 bg-primary-50/50 dark:border-primary-800/40 dark:bg-primary-950/20" :
      "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    )}>
      <div className="flex items-center gap-1.5 text-neutral-500">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn(
        "mt-1 text-xl font-bold tabular-nums",
        warn ? "text-rose-600 dark:text-rose-300" : accent ? "text-primary-600 dark:text-primary-300" : ""
      )}>{value}</div>
    </div>
  );
}
