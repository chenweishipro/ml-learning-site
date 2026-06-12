"use client";

import { useEffect, useState } from "react";
import { Calendar, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapDay {
  date: string;
  minutes: number;
  completed: number;
  sessions: number;
}

interface HeatmapData {
  year: number;
  days: HeatmapDay[];
  totalMinutes: number;
  totalDays: number;
  longestStreak: number;
  currentStreak: number;
}

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const DAY_LABELS = ["", "周一", "", "周三", "", "周五", ""];

export function YearHeatmap({ year: initialYear = new Date().getFullYear() }: { year?: number }) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);

  const load = async (y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/study/heatmap/?year=${y}`, { credentials: "include" });
      const j = await res.json();
      if (j.ok) setData(j.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(year);
  }, [year]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-neutral-400" />
          <h2 className="text-lg font-semibold">学习热力图</h2>
        </div>
        <p className="mt-3 text-sm text-neutral-500">加载中…</p>
      </div>
    );
  }

  // 按周分: [weekIndex][dayOfWeek] = day
  const weeks: HeatmapDay[][] = [];
  let week: HeatmapDay[] = [];
  // 找 1月1日是周几
  const firstDate = new Date(`${year}-01-01T00:00:00Z`);
  const firstDow = firstDate.getUTCDay(); // 0=Sun, 1=Mon, ...
  for (let i = 0; i < firstDow; i++) week.push(null as any);
  for (const day of data.days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null as any);
    weeks.push(week);
  }

  // 月份分割 (在第几周结束)
  const monthEnds: number[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w].find((d) => d);
    if (firstDay) {
      const m = parseInt(firstDay.date.slice(5, 7), 10) - 1;
      if (m !== lastMonth) {
        monthEnds.push(w);
        lastMonth = m;
      }
    }
  }

  const maxMin = Math.max(1, ...data.days.map((d) => d.minutes));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">学习热力图</h2>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {year > 2024 && (
            <button onClick={() => setYear(year - 1)} className="rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">‹</button>
          )}
          <span className="rounded px-2 py-1 font-medium tabular-nums">{year}</span>
          {year < new Date().getFullYear() && (
            <button onClick={() => setYear(year + 1)} className="rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">›</button>
          )}
        </div>
      </div>

      {/* 总览 stats */}
      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/50">
          <div className="text-xs text-neutral-500">总学习</div>
          <div className="mt-0.5 text-lg font-bold tabular-nums">{data.totalMinutes}<span className="text-xs font-normal text-neutral-500"> 分钟</span></div>
        </div>
        <div className="rounded-lg bg-amber-50 p-2.5 dark:bg-amber-950/30">
          <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
            <Flame className="h-3 w-3" /> 当前连续
          </div>
          <div className="mt-0.5 text-lg font-bold tabular-nums text-amber-700 dark:text-amber-300">{data.currentStreak}<span className="text-xs font-normal"> 天</span></div>
        </div>
        <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-950/30">
          <div className="flex items-center gap-1 text-xs text-primary-700 dark:text-primary-300">
            <TrendingUp className="h-3 w-3" /> 最长连续
          </div>
          <div className="mt-0.5 text-lg font-bold tabular-nums text-primary-700 dark:text-primary-300">{data.longestStreak}<span className="text-xs font-normal"> 天</span></div>
        </div>
      </div>

      {/* 热力图 grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* 月份 label */}
          <div className="flex gap-[3px] pl-7 text-[10px] text-neutral-500">
            {monthEnds.map((w, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? `${w * 13}px` : "0" }}>
                {MONTH_LABELS[parseInt(data.days.find((d) => d && d.date.endsWith("-01"))?.date.slice(5, 7) ?? "1", 10) - 1 + i] || MONTH_LABELS[i]}
              </div>
            ))}
          </div>
          <div className="flex">
            {/* 星期 label */}
            <div className="flex flex-col gap-[3px] pr-1.5 pt-0 text-[10px] text-neutral-500">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="h-[11px] leading-[11px]">{d}</div>
              ))}
            </div>
            {/* 格子 */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={cn(
                        "h-[11px] w-[11px] rounded-sm",
                        !day && "invisible",
                        day && day.minutes === 0 && "bg-neutral-100 dark:bg-neutral-800",
                        day && day.minutes > 0 && colorClass(day.minutes, maxMin)
                      )}
                      title={day ? `${day.date} · ${day.minutes} 分钟${day.completed ? ` · 完 ${day.completed} 章` : ""}` : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-neutral-500">
        <span>少</span>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div
            key={i}
            className={cn(
              "h-[11px] w-[11px] rounded-sm",
              i === 0 ? "bg-neutral-100 dark:bg-neutral-800" : colorClass(p * maxMin, maxMin)
            )}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}

function colorClass(minutes: number, maxMin: number): string {
  if (minutes <= 0) return "bg-neutral-100 dark:bg-neutral-800";
  const p = minutes / maxMin;
  if (p <= 0.25) return "bg-emerald-100 dark:bg-emerald-950/50";
  if (p <= 0.5) return "bg-emerald-300 dark:bg-emerald-800/60";
  if (p <= 0.75) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-700 dark:bg-emerald-400";
}
