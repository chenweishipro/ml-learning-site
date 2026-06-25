"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Segment = "newbie" | "active-7d" | "active-30d" | "dormant" | "power-user" | "completionist" | "quiz-master" | "contributor";

interface SegmentedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  stats: {
    chaptersCompleted: number;
    quizAttempts: number;
    avgScore: number;
    comments: number;
    notes: number;
    submissions: number;
  };
  segments: Segment[];
}

const SEGMENT_META: Record<Segment, { label: string; color: string; icon: string; desc: string }> = {
  "newbie":        { label: "🌱 新手",   color: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50", icon: "🌱", desc: "7 天内注册" },
  "active-7d":     { label: "🔥 7 日活跃", color: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:ring-orange-800/50", icon: "🔥", desc: "7 天内有学习记录" },
  "active-30d":    { label: "✨ 30 日活跃", color: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50", icon: "✨", desc: "30 天内有学习记录" },
  "dormant":       { label: "😴 潜水党",   color: "bg-neutral-100 text-neutral-500 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700", icon: "😴", desc: "30 天以上无活动" },
  "power-user":    { label: "💪 学习达人", color: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50", icon: "💪", desc: "完成 10+ 章" },
  "completionist": { label: "🏆 完成者",   color: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-700", icon: "🏆", desc: "完成 30+ 章" },
  "quiz-master":   { label: "🎯 高分选手", color: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50", icon: "🎯", desc: "quiz 平均分 >= 90" },
  "contributor":   { label: "💎 贡献者",   color: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50", icon: "💎", desc: "提交过作业 + 评论 5+" },
};

const ALL_SEGMENTS: Segment[] = Object.keys(SEGMENT_META) as Segment[];

export function UserSegmentsClient() {
  const [data, setData] = useState<SegmentedUser[]>([]);
  const [segmentCount, setSegmentCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<Segment | "all">("all");

  useEffect(() => {
    load();
  }, [activeSegment]);

  async function load() {
    setLoading(true);
    const url = activeSegment === "all" ? "/api/admin/users/segments/" : `/api/admin/users/segments/?segment=${activeSegment}`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.ok) {
      setData(j.data);
      setSegmentCount(j.segmentCount);
    }
    setLoading(false);
  }

  return (
    <div className="container max-w-6xl py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到 admin
      </Link>
      <div className="mt-3 mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Sparkles className="h-7 w-7 text-primary-600" />
          用户分群
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          基于学习行为自动给用户打标签, 看清活跃用户/学习达人/潜水党
        </p>
      </div>

      {/* 分群卡片 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <button
          onClick={() => setActiveSegment("all")}
          className={cn(
            "rounded-xl border p-4 text-left transition",
            activeSegment === "all"
              ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
              : "border-neutral-200 bg-white hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900"
          )}
        >
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Users className="h-3.5 w-3.5" /> 全部用户
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {Object.values(segmentCount).reduce((a, b) => Math.max(a, b), 0) || 0}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-500">所有用户</div>
        </button>
        {ALL_SEGMENTS.map((seg) => {
          const meta = SEGMENT_META[seg];
          const count = segmentCount[seg] ?? 0;
          return (
            <button
              key={seg}
              onClick={() => setActiveSegment(seg)}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                activeSegment === seg
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                  : "border-neutral-200 bg-white hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900"
              )}
            >
              <div className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1", meta.color)}>
                {meta.label}
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {count}
              </div>
              <div className="mt-0.5 text-[10px] text-neutral-500">{meta.desc}</div>
            </button>
          );
        })}
      </div>

      {/* 用户列表 */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          {activeSegment === "all" ? "还没有用户" : `${SEGMENT_META[activeSegment].label} 暂无用户`}
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Link href={`/u/${u.id}/`} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-400 to-violet-500 text-xs font-semibold text-white">
                {(u.displayName ?? u.email).slice(0, 2).toUpperCase()}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/u/${u.id}/`} className="truncate text-sm font-medium hover:underline">
                    {u.displayName ?? u.email}
                  </Link>
                  <span className="text-[10px] text-neutral-500">{u.role}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-500">
                  <span>{u.email}</span>
                  <span>·</span>
                  <span>注册 {new Date(u.createdAt).toLocaleDateString("zh-CN")}</span>
                  {u.stats.chaptersCompleted > 0 && <span>· 已完成 {u.stats.chaptersCompleted} 章</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {u.segments.map((seg) => (
                  <span
                    key={seg}
                    className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1", SEGMENT_META[seg].color)}
                    title={SEGMENT_META[seg].desc}
                  >
                    {SEGMENT_META[seg].icon}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
