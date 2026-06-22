"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Award, BookOpen, MessageSquare, StickyNote, Users, Sparkles, Gift, TrendingUp, Loader2 } from "lucide-react";

interface OverviewData {
  users: { total: number; newThisWeek: number; activeToday: number; activeThisWeek: number };
  content: { totalChaptersCompleted: number; totalComments: number; totalNotes: number; totalBadges: number; totalInviteCodes: number; invitedUsers: number };
  topCourses: Array<{ course: string; completions: number }>;
  topChapters: Array<{ course: string; chapter: string; completions: number }>;
  topActiveUsers: Array<{ userId: string; chapters: number }>;
}

export function OverviewClient() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/stats/overview/", { credentials: "include" });
      const j = await r.json();
      if (!j.ok) {
        setError(j.error ?? "加载失败");
        return;
      }
      setData(j.data);
    })();
  }, []);

  if (error) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const cards = [
    { icon: Users, label: "总用户", value: data.users.total, sub: `+${data.users.newThisWeek} 本周`, color: "from-sky-500 to-blue-600" },
    { icon: TrendingUp, label: "今日活跃", value: data.users.activeToday, sub: `本周 ${data.users.activeThisWeek}`, color: "from-emerald-500 to-teal-600" },
    { icon: BookOpen, label: "章节完成", value: data.content.totalChaptersCompleted, sub: "总完成数", color: "from-violet-500 to-purple-600" },
    { icon: MessageSquare, label: "评论", value: data.content.totalComments, sub: "全站评论", color: "from-amber-500 to-orange-600" },
    { icon: StickyNote, label: "笔记", value: data.content.totalNotes, sub: "全站笔记", color: "from-rose-500 to-pink-600" },
    { icon: Award, label: "徽章", value: data.content.totalBadges, sub: "已颁发", color: "from-yellow-500 to-amber-600" },
    { icon: Gift, label: "邀请成功", value: data.content.invitedUsers, sub: `总生成 ${data.content.totalInviteCodes}`, color: "from-cyan-500 to-sky-600" },
  ];

  return (
    <div className="container max-w-6xl py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到 admin
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">📊 平台概览</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        实时统计, 帮 admin 看清平台状态
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </div>
            <div className={`mt-2 bg-gradient-to-br ${c.color} bg-clip-text text-2xl font-bold text-transparent`}>
              {c.value}
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-500">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> 课程完成排行
          </h2>
          <ul className="mt-3 space-y-1.5">
            {data.topCourses.length === 0 ? <li className="text-xs text-neutral-500">暂无数据</li> : null}
            {data.topCourses.map((c, i) => (
              <li key={c.course} className="flex items-center gap-2 text-sm">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {i + 1}
                </span>
                <Link href={`/courses/${c.course}/`} className="flex-1 hover:underline">{c.course}</Link>
                <span className="text-xs tabular-nums text-neutral-500">{c.completions} 人</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> 章节热度
          </h2>
          <ul className="mt-3 space-y-1.5">
            {data.topChapters.length === 0 ? <li className="text-xs text-neutral-500">暂无数据</li> : null}
            {data.topChapters.map((c, i) => (
              <li key={`${c.course}/${c.chapter}`} className="flex items-center gap-2 text-sm">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  {i + 1}
                </span>
                <Link href={`/courses/${c.course}/${c.chapter}/`} className="flex-1 truncate hover:underline">
                  {c.chapter}
                </Link>
                <span className="text-xs tabular-nums text-neutral-500">{c.completions}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Users className="h-3.5 w-3.5" /> 活跃学习者 (完成章节数)
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-5">
          {data.topActiveUsers.map((u, i) => (
            <Link
              key={u.userId}
              href={`/u/${u.userId}/`}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:hover:border-primary-700"
            >
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">{u.userId.slice(-6)}</div>
                <div className="text-[10px] text-neutral-500">{u.chapters} 章</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-400">
        数据更新于 {new Date().toLocaleString("zh-CN")}
      </p>
    </div>
  );
}
