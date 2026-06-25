"use client";
import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { layoutGraph, getEdges, NODE_COLORS, type KGNode } from "@/lib/knowledge-graph";
import { ArrowRight, BookOpen, Filter, Layers, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeGraphProps {
  width?: number;
  height?: number;
  /** 仅显示课程节点 (默认 true) */
  courseOnly?: boolean;
  /** 初始聚焦节点 id */
  focusId?: string;
}

export function KnowledgeGraph({ width = 1100, height = 700, courseOnly = true, focusId }: KnowledgeGraphProps) {
  const allEdges = useMemo(() => getEdges(), []);
  const { nodes, layers } = useMemo(() => layoutGraph(width, height), [width, height]);

  const [filter, setFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [hover, setHover] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showChapters, setShowChapters] = useState(!courseOnly);
  const containerRef = useRef<HTMLDivElement>(null);

  // 节点过滤
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (!showChapters && n.kind === "chapter") return false;
      if (filter !== "all" && n.level !== filter) return false;
      return true;
    });
  }, [nodes, filter, showChapters]);

  // 边过滤
  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    return allEdges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));
  }, [allEdges, visibleNodes]);

  const hoverNode = hover ? nodes.find((n) => n.id === hover) : null;

  const getNodePos = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n ? { x: (n.x ?? 0) * zoom + (width * (1 - zoom)) / 2, y: (n.y ?? 0) * zoom + (height * (1 - zoom)) / 2 } : null;
  };

  const levelColors: Record<string, string> = {
    beginner: "ring-emerald-300 dark:ring-emerald-700",
    intermediate: "ring-sky-300 dark:ring-sky-700",
    advanced: "ring-rose-300 dark:ring-rose-700",
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 p-3 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Filter className="h-3.5 w-3.5" /> 难度:
          </span>
          {(["all", "beginner", "intermediate", "advanced"] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => setFilter(lv)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium transition",
                filter === lv
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              )}
            >
              {lv === "all" ? "全部" : lv === "beginner" ? "入门" : lv === "intermediate" ? "进阶" : "高级"}
            </button>
          ))}
          <button
            onClick={() => setShowChapters((v) => !v)}
            className={cn(
              "ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition",
              showChapters
                ? "bg-violet-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            )}
          >
            <Layers className="h-3 w-3" />
            章节 {showChapters ? "显示" : "隐藏"}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
            className="grid h-7 w-7 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            title="缩小"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="grid h-7 w-7 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            title="放大"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="grid h-7 w-7 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            title="重置"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <span className="ml-2 text-[10px] text-neutral-500 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* SVG 图谱 */}
      <div ref={containerRef} className="relative overflow-hidden" style={{ height }}>
        <svg width={width} height={height} className="block">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a3a3a3" />
            </marker>
            <marker id="arrow-hover" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
            </marker>
          </defs>

          {/* 边 */}
          {visibleEdges.map((e, i) => {
            const from = getNodePos(e.from);
            const to = getNodePos(e.to);
            if (!from || !to) return null;
            const isHover = hover && (e.from === hover || e.to === hover);
            return (
              <line
                key={`edge-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHover ? "#0ea5e9" : "#d4d4d4"}
                strokeWidth={isHover ? 2 : 1}
                strokeOpacity={hover ? (isHover ? 1 : 0.15) : 0.5}
                markerEnd={isHover ? "url(#arrow-hover)" : "url(#arrow)"}
              />
            );
          })}

          {/* 节点 */}
          {visibleNodes.map((n) => {
            const pos = getNodePos(n.id);
            if (!pos) return null;
            const color = NODE_COLORS[n.courseSlug] ?? "#0ea5e9";
            const isCourse = n.kind === "course";
            const r = isCourse ? 18 : 8;
            const isHover = hover === n.id;
            const isFocus = focusId === n.id;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + (isHover ? 3 : 0)}
                  fill={color}
                  fillOpacity={isCourse ? 1 : 0.7}
                  stroke={isFocus ? "#0ea5e9" : isHover ? "#fff" : "transparent"}
                  strokeWidth={isFocus ? 3 : isHover ? 2 : 0}
                />
                <text
                  x={pos.x}
                  y={pos.y + r + 12}
                  textAnchor="middle"
                  fontSize={isCourse ? "12" : "9"}
                  fontWeight={isCourse ? "600" : "400"}
                  fill="currentColor"
                  className="pointer-events-none select-none text-neutral-700 dark:text-neutral-300"
                >
                  {n.title.length > 18 ? n.title.slice(0, 18) + "…" : n.title}
                </text>
              </g>
            );
          })}
        </svg>

        {/* hover tooltip */}
        {hoverNode && (
          <div className="pointer-events-none absolute right-3 top-3 max-w-xs rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-soft backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
            <div className="flex items-center gap-2">
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: NODE_COLORS[hoverNode.courseSlug] ?? "#0ea5e9" }}
              >
                {hoverNode.kind === "course" ? "📚" : "📄"}
              </span>
              <span className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
                {hoverNode.title}
              </span>
            </div>
            {hoverNode.description && (
              <p className="mt-1.5 line-clamp-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                {hoverNode.description}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400">
              <span>难度: {hoverNode.level}</span>
              {hoverNode.duration && <span>· {hoverNode.duration}</span>}
              <span>· layer {layers.get(hoverNode.id) ?? 0}</span>
            </div>
            {hoverNode.kind === "course" ? (
              <Link
                href={`/courses/${hoverNode.slug}/`}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary-700 hover:underline dark:text-primary-300"
              >
                打开课程 <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            ) : (
              <Link
                href={`/courses/${hoverNode.slug}/`}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary-700 hover:underline dark:text-primary-300"
              >
                打开章节 <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            )}
          </div>
        )}

        {/* legend */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/95 px-2 py-1 text-[10px] backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-primary-500" />
            课程
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-primary-500 opacity-70" />
            章节
          </span>
          <span className="ml-1 text-neutral-500">→ 前置</span>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 gap-2 border-t border-neutral-200 p-3 text-center text-[10px] text-neutral-500 dark:border-neutral-800 md:grid-cols-4">
        <div>
          <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {nodes.filter((n) => n.kind === "course").length}
          </span>
          门课程
        </div>
        <div>
          <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {nodes.filter((n) => n.kind === "chapter").length}
          </span>
          个章节
        </div>
        <div>
          <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {allEdges.length}
          </span>
          条依赖关系
        </div>
        <div>
          <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {Math.max(0, ...Array.from(layers.values())) + 1}
          </span>
          个学习阶段
        </div>
      </div>
    </div>
  );
}
