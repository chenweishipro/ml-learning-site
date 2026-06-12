"use client";
import { BADGES, TIER_META, type BadgeState } from "@/lib/badges";
import { Award, Lock, Sparkles, Trophy, Target, Calendar, BookOpen, Code, Brain, MessageSquare, FileText, Lightbulb, ScrollText, CheckCircle2, Zap, GraduationCap, Clock } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function AchievementsClient({
  earned,
  state,
}: {
  earned: Array<{ id: string; context?: string; earnedAt: string }>;
  state: BadgeState;
}) {
  const earnedMap = useMemo(() => {
    const m = new Map<string, { context?: string; earnedAt: string }>();
    for (const e of earned) m.set(e.id, { context: e.context, earnedAt: e.earnedAt });
    return m;
  }, [earned]);

  const earnedList = BADGES.filter((b) => earnedMap.has(b.id));
  const lockedList = BADGES.filter((b) => !earnedMap.has(b.id));

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50">
            <Trophy className="h-3 w-3" />
            成就殿堂
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">成就 & 勋章</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            累计 {earnedList.length} / {BADGES.length} 枚勋章
          </p>
        </div>
        <form action="/api/badges/check" method="post" onSubmit={(e) => { e.preventDefault(); fetch("/api/badges/check", { method: "POST" }).then((r) => r.json()).then((d) => { if (d.count > 0) location.reload(); }); }}>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50">
            <Sparkles className="h-3.5 w-3.5" />
            重新检查可获勋章
          </button>
        </form>
      </div>

      {/* 状态卡 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="完成章节" value={state.chaptersCompleted} />
        <StatCard icon={<GraduationCap className="h-4 w-4" />} label="完成课程" value={state.coursesCompleted} />
        <StatCard icon={<Calendar className="h-4 w-4" />} label="连续天数" value={state.consecutiveDays} accent />
        <StatCard icon={<Clock className="h-4 w-4" />} label="总学习" value={`${state.totalHours.toFixed(1)}h`} />
        <StatCard icon={<Brain className="h-4 w-4" />} label="答对题" value={state.quizzesPassed} />
        <StatCard icon={<Code className="h-4 w-4" />} label="编程通关" value={state.codingChallengesPassed} />
        <StatCard icon={<ScrollText className="h-4 w-4" />} label="证书" value={state.certificatesCount} />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="评论" value={state.commentsCount} />
      </div>

      {/* 已获得 */}
      {earnedList.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            <Award className="mr-1 inline h-4 w-4 text-amber-500" /> 已获得 ({earnedList.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {earnedList.map((b) => {
              const m = earnedMap.get(b.id)!;
              const meta = TIER_META[b.tier];
              return (
                <div key={b.id} className={cn("rounded-xl border p-4 ring-1", meta.bg, meta.ring, "border-transparent")}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-white text-2xl shadow-sm dark:bg-neutral-900">
                      {b.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{b.name}</h3>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", meta.text, "bg-white/60 dark:bg-neutral-900/60")}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{b.description}</p>
                      <p className="mt-1 text-[10px] text-neutral-500">
                        {new Date(m.earnedAt).toLocaleDateString("zh-CN")} {m.context ? `· ${m.context}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 未解锁 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          <Lock className="mr-1 inline h-4 w-4 text-neutral-400" /> 未解锁 ({lockedList.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {lockedList.map((b) => {
            const meta = TIER_META[b.tier];
            return (
              <div key={b.id} className="rounded-xl border border-neutral-200 bg-white/60 p-4 opacity-70 dark:border-neutral-800 dark:bg-neutral-900/40">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-neutral-100 text-2xl grayscale dark:bg-neutral-800">
                    🔒
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-700 dark:text-neutral-300">{b.name}</h3>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", meta.text, "bg-neutral-100 dark:bg-neutral-800")}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{b.description}</p>
                    <p className="mt-1 text-[10px] text-neutral-500">未达成</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3", accent ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900")}>
      <div className="flex items-center gap-1.5 text-neutral-500">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn("mt-1 text-xl font-bold", accent && "text-amber-600 dark:text-amber-300")}>
        {value}
      </div>
    </div>
  );
}
