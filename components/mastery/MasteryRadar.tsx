"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Radar,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface CourseMastery {
  slug: string;
  title: string;
  level: string;
  completion: number;
  totalChapters: number;
  completedChapters: number;
  status: string;
}

interface Props {
  overall: number;
  byLevel: Array<{
    level: string;
    label: string;
    average: number;
    courseCount: number;
    chapterCount: number;
    completedChapterCount: number;
  }>;
  courses: CourseMastery[];
  blindSpots: CourseMastery[];
  strengths: CourseMastery[];
  total: { courses: number; chapters: number; completedChapters: number; inProgressChapters: number };
}

/** 雷达图 (自己画 SVG, 不引入 chart 库) */
function MasteryRadar({
  labels,
  values,
  size = 300,
}: {
  labels: string[];
  values: number[]; // 0..1
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 36;
  const n = labels.length;
  const angleStep = (Math.PI * 2) / n;

  // 计算每个 label 的位置
  const points = useMemo(() => {
    return values.map((v, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      return {
        x: cx + radius * v * Math.cos(angle),
        y: cy + radius * v * Math.sin(angle),
        lx: cx + (radius + 18) * Math.cos(angle),
        ly: cy + (radius + 18) * Math.sin(angle),
        labelAngle: angle,
      };
    });
  }, [values, n]);

  // 网格线 (5 层)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block"
        aria-label="知识点掌握度雷达图"
      >
        {/* 网格 (五边形 / N 边形) */}
        {gridLevels.map((g) => (
          <polygon
            key={g}
            points={Array.from({ length: n }, (_, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              return `${cx + radius * g * Math.cos(angle)},${cy + radius * g * Math.sin(angle)}`;
            }).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={g === 1 ? 1.5 : 0.6}
            className="text-neutral-300 dark:text-neutral-700"
          />
        ))}
        {/* 轴线 */}
        {Array.from({ length: n }, (_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + radius * Math.cos(angle)}
              y2={cy + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-neutral-300 dark:text-neutral-700"
            />
          );
        })}
        {/* 数据多边形 */}
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="rgb(99, 102, 241)"
          strokeWidth={2}
          strokeLinejoin="round"
          className="dark:fill-indigo-500/30"
        />
        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={3}
              fill="rgb(99, 102, 241)"
              stroke="white"
              strokeWidth={1.5}
            />
            <text
              x={p.lx}
              y={p.ly}
              textAnchor={p.labelAngle > Math.PI / 2 ? "end" : p.labelAngle < -Math.PI / 2 ? "start" : "middle"}
              dominantBaseline="middle"
              className="fill-neutral-700 text-[11px] font-medium dark:fill-neutral-300"
            >
              {labels[i]}
            </text>
            <text
              x={p.lx}
              y={p.ly + 12}
              textAnchor={p.labelAngle > Math.PI / 2 ? "end" : p.labelAngle < -Math.PI / 2 ? "start" : "middle"}
              dominantBaseline="middle"
              className="fill-indigo-600 text-[10px] dark:fill-indigo-400"
            >
              {(values[i] * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        {/* 中心点 */}
        <circle cx={cx} cy={cy} r={2} fill="currentColor" className="text-neutral-400" />
      </svg>
    </div>
  );
}

export function MasteryClient(props: Props) {
  const { overall, byLevel, courses, blindSpots, strengths, total } = props;

  // 雷达图用的 3 level 数据
  const radarLabels = byLevel.map((b) => b.label);
  const radarValues = byLevel.map((b) => b.average);

  return (
    <div className="space-y-6">
      {/* 顶部 4 个关键指标 */}
      <div className="grid gap-3 sm:grid-cols-4">
        <MetricCard icon={Target} label="总体掌握度" value={`${(overall * 100).toFixed(1)}%`} color="primary" sub={`${total.completedChapters} / ${total.chapters} 章`} />
        <MetricCard icon={CheckCircle2} label="已学完课程" value={strengths.length} color="emerald" sub={`≥ 80% 完成`} />
        <MetricCard icon={AlertCircle} label="知识盲点" value={blindSpots.length} color="amber" sub="高 level 但 < 30%" />
        <MetricCard icon={TrendingUp} label="进行中" value={total.inProgressChapters} color="blue" sub="已开始章节" />
      </div>

      {/* 雷达图 + Level 明细 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
              <Target className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              知识点掌握雷达 (v19.8)
            </h3>
          </div>
          <MasteryRadar labels={radarLabels} values={radarValues} size={320} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
            {byLevel.map((b) => (
              <div
                key={b.level}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-950/40"
              >
                <div className="text-neutral-500 dark:text-neutral-400">{b.label}</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {(b.average * 100).toFixed(0)}%
                </div>
                <div className="text-neutral-400">{b.completedChapterCount}/{b.chapterCount} 章</div>
              </div>
            ))}
          </div>
        </section>

        {/* 课程清单 (按 status 分类) */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                全部 {total.courses} 门课程进度
              </h3>
            </div>
            <Link
              href="/courses/"
              className="text-[11px] text-primary-700 hover:underline dark:text-primary-400"
            >
              浏览课程 →
            </Link>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {courses.map((c) => (
              <CourseRow key={c.slug} c={c} />
            ))}
          </div>
        </section>
      </div>

      {/* 强项 + 盲点 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 强项 */}
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-neutral-900 dark:to-teal-950/30">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
              你的强项 ({strengths.length})
            </h3>
          </div>
          {strengths.length === 0 ? (
            <p className="rounded-md border border-dashed border-emerald-300 bg-white/40 p-3 text-xs text-emerald-700/70 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300/60">
              学完任一门课 (≥ 80%) 就会出现在这里
            </p>
          ) : (
            <ul className="space-y-1.5">
              {strengths.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/courses/${c.slug}/`}
                    className="group flex items-center gap-2 rounded-md border border-emerald-100 bg-white/60 px-2 py-1.5 text-xs transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <span className="flex-1 font-medium text-emerald-900 group-hover:underline dark:text-emerald-300">
                      {c.title}
                    </span>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                      {(c.completion * 100).toFixed(0)}% · {c.completedChapters}/{c.totalChapters}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 知识盲点 */}
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-neutral-900 dark:to-orange-950/30">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              知识盲点 ({blindSpots.length})
            </h3>
          </div>
          {blindSpots.length === 0 ? (
            <p className="rounded-md border border-dashed border-amber-300 bg-white/40 p-3 text-xs text-amber-700/70 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300/60">
              高级/进阶课程掌握 ≥ 30% 的话没有盲点啦
            </p>
          ) : (
            <ul className="space-y-1.5">
              {blindSpots.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/courses/${c.slug}/`}
                    className="group flex items-center gap-2 rounded-md border border-amber-100 bg-white/60 px-2 py-1.5 text-xs transition hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 dark:hover:border-amber-700 dark:hover:bg-amber-950/40"
                  >
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    <span className="flex-1 font-medium text-amber-900 group-hover:underline dark:text-amber-300">
                      {c.title}
                    </span>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                      {LEVEL_LABEL(c.level)} · {(c.completion * 100).toFixed(0)}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function LEVEL_LABEL(lv: string) {
  return lv === "beginner" ? "入门" : lv === "advanced" ? "进阶" : "高级";
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  sub?: string;
  color: "primary" | "emerald" | "amber" | "blue";
}) {
  const COLOR_MAP: Record<string, string> = {
    primary: "bg-primary-50 text-primary-600 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-400 dark:ring-primary-800/50",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/50",
    amber: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/50",
    blue: "bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/50",
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <span className={`grid h-5 w-5 place-items-center rounded ring-1 ${COLOR_MAP[color]}`}>
          <Icon className="h-3 w-3" />
        </span>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{sub}</div>}
    </div>
  );
}

function CourseRow({ c }: { c: CourseMastery }) {
  const StatusIcon =
    c.status === "mastered"
      ? CheckCircle2
      : c.status === "in-progress"
      ? Circle
      : Circle;
  const color =
    c.status === "mastered"
      ? "text-emerald-500"
      : c.status === "in-progress"
      ? "text-blue-500"
      : "text-neutral-300";
  return (
    <Link
      href={`/courses/${c.slug}/`}
      className="group block rounded-md border border-neutral-200 px-2.5 py-1.5 transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-neutral-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
          <span className="truncate text-xs font-medium text-neutral-900 group-hover:text-indigo-700 dark:text-neutral-50 dark:group-hover:text-indigo-300">
            {c.title}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${levelColor(c.level)}`}>
            {LEVEL_LABEL(c.level)}
          </span>
        </div>
        <span className="flex items-center gap-1.5 tabular-nums text-[10px] text-neutral-500">
          <span>
            {c.completedChapters}/{c.totalChapters}
          </span>
          <span
            className={`rounded px-1 py-0.5 font-medium ${
              c.completion === 1
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                : c.completion > 0
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {(c.completion * 100).toFixed(0)}%
          </span>
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-200/60 dark:bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all ${
            c.completion === 1
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-indigo-600 to-indigo-500"
          }`}
          style={{ width: `${c.completion * 100}%` }}
        />
      </div>
    </Link>
  );
}

function levelColor(lv: string) {
  switch (lv) {
    case "beginner":
      return "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300";
    case "advanced":
      return "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300";
    case "expert":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
    default:
      return "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400";
  }
}
