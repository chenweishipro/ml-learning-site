"use client";

import { Sparkles, Target, Trophy } from "lucide-react";

interface Props {
  bestDay: { date: string; minutes: number } | null;
  streak: number;
  completionRate: number;
  activeDays: number;
}

export function Insights({ bestDay, streak, completionRate, activeDays }: Props) {
  // 根据数据生成个性化 insights
  const tips: Array<{ icon: any; title: string; desc: string; color: string }> = [];

  if (streak === 0) {
    tips.push({
      icon: Target,
      title: "今日打卡",
      desc: "学习任何一节就能开启连续打卡, 从 1 天开始。",
      color: "from-orange-500 to-red-500",
    });
  } else if (streak < 3) {
    tips.push({
      icon: Sparkles,
      title: `保持 ${streak} 天节奏`,
      desc: "连续打卡是最有效的习惯养成, 继续!",
      color: "from-orange-500 to-amber-500",
    });
  } else if (streak < 7) {
    tips.push({
      icon: Trophy,
      title: `${streak} 天连续打卡`,
      desc: "距离周习惯只差几天, 加油!",
      color: "from-emerald-500 to-green-500",
    });
  } else {
    tips.push({
      icon: Trophy,
      title: `${streak} 天连续打卡 🏆`,
      desc: "你已经是真正的学习者了!",
      color: "from-amber-500 to-yellow-500",
    });
  }

  if (bestDay && bestDay.minutes >= 60) {
    tips.push({
      icon: Sparkles,
      title: `巅峰 ${bestDay.minutes} 分钟`,
      desc: `${bestDay.date} 是你最高效的一天, 试着复制这个节奏。`,
      color: "from-blue-500 to-cyan-500",
    });
  }

  if (activeDays < 10) {
    tips.push({
      icon: Target,
      title: `近 30 天 ${activeDays} 天活跃`,
      desc: "试着每周固定 3-4 天学习, 形成节奏。",
      color: "from-purple-500 to-pink-500",
    });
  }

  if (completionRate < 10) {
    tips.push({
      icon: Sparkles,
      title: `完成率 ${completionRate.toFixed(1)}%`,
      desc: "先把一门课从入门到结业, 比浅尝多门更有收获。",
      color: "from-indigo-500 to-purple-500",
    });
  } else if (completionRate >= 50) {
    tips.push({
      icon: Trophy,
      title: `完成率 ${completionRate.toFixed(0)}% 🎉`,
      desc: "已经过半了, 离学完只差一步之遥!",
      color: "from-emerald-500 to-teal-500",
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-600" />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
          个性化建议
        </h3>
      </div>

      <div className="space-y-3">
        {tips.map((t, i) => {
          const Icon = t.icon;
          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-3 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950"
            >
              <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${t.color} opacity-10 blur-xl transition group-hover:opacity-20`} />
              <div className="flex items-start gap-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${t.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {t.title}
                  </div>
                  <div className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {t.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}