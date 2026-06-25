"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Crown, Loader2, Medal, Sparkles, Target, TrendingUp, Trophy } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

interface ChapterRank {
  courseSlug: string;
  chapterSlug: string;
  bestScore: number;
  avgScore: number;
  attempts: number;
}

interface UserRank {
  userId: string;
  displayName: string | null;
  email: string | null;
  avgScore: number;
  attempts: number;
}

interface MyStats {
  totalAttempts: number;
  avgScore: number;
  totalCorrect: number;
  totalQuestions: number;
}

export function PracticeClient() {
  const { user, ready } = useAuth();
  const [chapterRank, setChapterRank] = useState<ChapterRank[]>([]);
  const [userRank, setUserRank] = useState<UserRank[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/quiz/leaderboard/", { credentials: "include" });
      const j = await r.json();
      if (j.ok) {
        setChapterRank(j.data.chapterRank);
        setUserRank(j.data.userRank);
      }
      if (user) {
        const r2 = await fetch("/api/quiz/attempt/?limit=10", { credentials: "include" });
        const j2 = await r2.json();
        if (j2.ok) setMyStats(j2.data.stats);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const myRank = user ? userRank.findIndex((u) => u.userId === user.id) + 1 : 0;

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 text-xs font-medium text-white">
          <Trophy className="h-3 w-3" />
          章节练习排行
        </div>
        <h1 className="text-3xl font-bold tracking-tight">📊 练习统计与排行</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          全站章节练习最高分 + 我的练习统计 + 用户平均分排行
        </p>
      </header>

      {/* 我的统计卡片 */}
      {user && myStats && myStats.totalAttempts > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <MyStatCard icon={Target} label="总尝试" value={myStats.totalAttempts} sub="次 quiz" color="from-sky-500 to-blue-600" />
          <MyStatCard icon={Award} label="平均分" value={`${myStats.avgScore}`} sub="0-100" color="from-amber-500 to-orange-600" />
          <MyStatCard icon={Sparkles} label="答对题数" value={myStats.totalCorrect} sub={`共 ${myStats.totalQuestions} 题`} color="from-emerald-500 to-teal-600" />
          <MyStatCard icon={Crown} label="我的排名" value={myRank > 0 ? `#${myRank}` : "未上榜"} sub={userRank.length > 0 ? `/ ${userRank.length} 人` : ""} color="from-violet-500 to-purple-600" />
        </div>
      ) : user ? (
        <div className="mb-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          还没有练习记录, 去做章节 quiz 开启你的排行榜之旅 →
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          <Link href="/login" className="text-primary-700 hover:underline">登录</Link> 后查看你的练习统计
        </div>
      )}

      {/* 用户平均分行行 */}
      {userRank.length > 0 && (
        <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Crown className="h-4 w-4 text-amber-500" />
            🏆 全站平均分排行
          </h2>
          <ol className="space-y-1.5">
            {userRank.slice(0, 10).map((u, i) => {
              const name = u.displayName || u.email?.split("@")[0] || "匿名";
              const isMe = user && u.userId === user.id;
              return (
                <li
                  key={u.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    isMe && "bg-primary-50 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:ring-primary-800/50",
                    !isMe && "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  )}
                >
                  <span className={cn(
                    "grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold",
                    i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                    i === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                    i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" :
                    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  )}>
                    {i + 1}
                  </span>
                  <Link href={`/u/${u.userId}/`} className="flex-1 hover:underline">
                    {name}
                    {isMe && <span className="ml-1.5 text-[10px] text-primary-600">(你)</span>}
                  </Link>
                  <span className="text-xs tabular-nums text-neutral-500">
                    {u.avgScore} 分 · {u.attempts} 次
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* 章节排行 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary-600" />
          📚 章节最高分排行
        </h2>
        {chapterRank.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">还没有任何 quiz 尝试, 去任意章节做题吧!</p>
        ) : (
          <ol className="space-y-1.5">
            {chapterRank.slice(0, 20).map((c, i) => (
              <li
                key={`${c.courseSlug}/${c.chapterSlug}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
              >
                <span className={cn(
                  "grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold",
                  i < 3 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                  "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                )}>
                  {i + 1}
                </span>
                <Link
                  href={`/courses/${c.courseSlug}/${c.chapterSlug}/`}
                  className="flex-1 truncate hover:underline"
                >
                  <span className="font-mono text-xs text-neutral-500">{c.courseSlug}</span>
                  <span className="ml-2">{c.chapterSlug}</span>
                </Link>
                <span className="text-xs tabular-nums text-neutral-500">
                  最高 {c.bestScore} · 平均 {c.avgScore} · {c.attempts} 次
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function MyStatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-2 bg-gradient-to-br ${color} bg-clip-text text-2xl font-bold text-transparent`}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-neutral-500">{sub}</div>
    </div>
  );
}
