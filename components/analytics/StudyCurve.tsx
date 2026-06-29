"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

interface Day {
  date: string;
  minutes: number;
  completed: number;
}

export function StudyCurve({ daily }: { daily: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxMin = Math.max(...daily.map((d) => d.minutes), 1);

  // SVG 尺寸
  const W = 800;
  const H = 220;
  const padL = 40;
  const padR = 16;
  const padT = 20;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // 折线点
  const points = daily.map((d, i) => {
    const x = padL + (i / (daily.length - 1)) * plotW;
    const y = padT + (1 - d.minutes / maxMin) * plotH;
    return { x, y, d };
  });

  // 平滑路径
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // 区域路径
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padT + plotH}` +
    ` L ${points[0].x} ${padT + plotH} Z`;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
            <Activity className="h-4 w-4 text-primary-600" />
            近 30 天学习曲线
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            每日累计学习分钟数 · 峰值 {Math.max(...daily.map((d) => d.minutes))} 分钟
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-500" /> 学习时长
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = padT + (1 - t) * plotH;
            const val = Math.round(t * maxMin);
            return (
              <g key={i}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="2 4"
                />
                <text
                  x={padL - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-neutral-400 text-[10px]"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* 区域 */}
          <path d={areaPath} fill="url(#curveGrad)" />
          {/* 折线 */}
          <path
            d={linePath}
            fill="none"
            stroke="rgb(99, 102, 241)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 数据点 + hover */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 5 : 2.5}
                fill="white"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer transition-all"
              />
              {hover === i && (
                <g>
                  <line
                    x1={p.x}
                    y1={padT}
                    x2={p.x}
                    y2={padT + plotH}
                    stroke="rgb(99, 102, 241)"
                    strokeOpacity="0.3"
                    strokeDasharray="3 3"
                  />
                </g>
              )}
            </g>
          ))}

          {/* X 轴日期标签 (每隔 5 天) */}
          {points.map((p, i) =>
            i % 5 === 0 || i === points.length - 1 ? (
              <text
                key={i}
                x={p.x}
                y={H - 10}
                textAnchor="middle"
                className="fill-neutral-400 text-[10px]"
              >
                {p.d.date.slice(5)}
              </text>
            ) : null
          )}
        </svg>

        {/* Tooltip */}
        {hover !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
            style={{
              left: `${(points[hover].x / W) * 100}%`,
              top: `${(points[hover].y / H) * 100}%`,
              marginTop: -8,
            }}
          >
            <div className="font-medium">{points[hover].d.date}</div>
            <div className="text-[10px] opacity-80">
              {points[hover].d.minutes} 分钟 · 完成 {points[hover].d.completed} 章
            </div>
          </div>
        )}
      </div>
    </div>
  );
}