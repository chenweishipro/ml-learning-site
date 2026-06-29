"use client";

import { Clock, BookOpen, Flame, Target, TrendingUp, CalendarDays } from "lucide-react";

interface KPI {
  totalMinutes: number;
  completedChapters: number;
  totalChapters: number;
  completionRate: number;
  streak: number;
  avgMinutesPerActiveDay: number;
  activeDays: number;
}

const fmtMinutes = (m: number) => {
  if (m < 60) return `${m} 分钟`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} 小时` : `${h} 小时 ${r} 分`;
};

export function KPICards({ kpi }: { kpi: KPI }) {
  const cards = [
    {
      label: "总学习时长",
      value: fmtMinutes(kpi.totalMinutes),
      sub: `近 30 天 ${kpi.activeDays} 天活跃`,
      icon: Clock,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "已完成章节",
      value: `${kpi.completedChapters} / ${kpi.totalChapters}`,
      sub: `完成率 ${kpi.completionRate.toFixed(1)}%`,
      icon: BookOpen,
      color: "from-emerald-500 to-green-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "连续打卡",
      value: `${kpi.streak} 天`,
      sub: kpi.streak > 0 ? "🔥 保持节奏" : "今日还没学习",
      icon: Flame,
      color: "from-orange-500 to-red-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      text: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "日均学习",
      value: fmtMinutes(kpi.avgMinutesPerActiveDay),
      sub: `每次学习平均 ${Math.round(kpi.avgMinutesPerActiveDay / Math.max(1, kpi.activeDays / 30))} 分钟`,
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft transition hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl transition group-hover:opacity-20`} />
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {c.label}
            </div>
            <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {c.value}
            </div>
            <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {c.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}