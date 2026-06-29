"use client";

import { BarChart3 } from "lucide-react";

interface Weekday {
  day: number;
  label: string;
  minutes: number;
  count: number;
}

export function WeekdayChart({ data }: { data: Weekday[] }) {
  const maxMin = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary-600" />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
          周内学习分布
        </h3>
        <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
          近 30 天
        </span>
      </div>

      <div className="space-y-2.5">
        {data.map((d) => {
          const pct = (d.minutes / maxMin) * 100;
          return (
            <div key={d.day} className="flex items-center gap-3">
              <div className="w-10 shrink-0 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {d.label}
              </div>
              <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
                {d.minutes > 0 && (
                  <div className="absolute inset-y-0 left-2 flex items-center text-[11px] font-medium text-white mix-blend-difference">
                    {d.minutes} 分
                  </div>
                )}
              </div>
              <div className="w-12 shrink-0 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                {d.count} 次
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-3 text-[11px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        {(() => {
          const maxDay = [...data].sort((a, b) => b.minutes - a.minutes)[0];
          if (!maxDay || maxDay.minutes === 0) {
            return "📊 还没有学习数据, 开始记录吧!";
          }
          return `📈 ${maxDay.label} 最高效, 累计 ${maxDay.minutes} 分钟`;
        })()}
      </div>
    </div>
  );
}