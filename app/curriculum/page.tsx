// 全平台学习路线图 — SVG 节点 + 连线
import Link from "next/link";
import { Map, Compass, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { getAllCoursesSync } from "@/lib/content-overrides";

export const metadata = {
  title: "学习路线图 · ML 学习站",
  description: "11 门课程、44 章节的可视化依赖关系, 一图看清学习路径。",
};

interface Node {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  chapters: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Edge {
  from: string;
  to: string;
}

const PREREQ_GRAPH: Record<string, string[]> = {
  "supervised-learning": ["ml-basics"],
  "neural-networks": ["ml-basics", "supervised-learning"],
  "deep-learning-advanced": ["neural-networks"],
  "reinforcement-learning": ["ml-basics"],
  "stats-probability": ["stats-foundations"],
  "stats-continuous": ["stats-foundations", "stats-probability"],
  "stats-estimation": ["stats-continuous"],
  "stats-testing": ["stats-estimation"],
  "stats-regression": ["stats-estimation", "stats-testing"],
};

function layoutNodes(): { nodes: Node[]; edges: Edge[] } {
  const allCourses = getAllCoursesSync();
  const levelOrder: Record<string, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };
  const layers: Record<number, typeof allCourses> = { 0: [], 1: [], 2: [] };
  for (const c of allCourses) {
    const lvl = (c as any).level || "beginner";
    layers[levelOrder[lvl]]!.push(c);
  }
  const NW = 200, NH = 80;
  const X_GAP = 60, Y_GAP = 40;
  const X0 = 40, Y0 = 40;
  const nodes: Node[] = [];
  for (let lvl = 0; lvl < 3; lvl++) {
    const items = layers[lvl] || [];
    items.forEach((c, i) => {
      nodes.push({
        id: c.slug,
        title: c.title,
        level: ((c as any).level || "beginner") as any,
        chapters: c.chapters.length,
        x: X0 + lvl * (NW + 250),
        y: Y0 + i * (NH + Y_GAP),
        width: NW,
        height: NH,
      });
    });
  }
  const edges: Edge[] = [];
  for (const [to, pres] of Object.entries(PREREQ_GRAPH)) {
    for (const from of pres) edges.push({ from, to });
  }
  return { nodes, edges };
}

const LEVEL_COLOR: Record<string, string> = {
  beginner: "#10b981",
  intermediate: "#0ea5e9",
  advanced: "#f59e0b",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

const LEVEL_BG: Record<string, string> = {
  beginner: "fill-emerald-50 dark:fill-emerald-950/30",
  intermediate: "fill-sky-50 dark:fill-sky-950/30",
  advanced: "fill-amber-50 dark:fill-amber-950/30",
};

const LEVEL_RING: Record<string, string> = {
  beginner: "stroke-emerald-300 dark:stroke-emerald-700",
  intermediate: "stroke-sky-300 dark:stroke-sky-700",
  advanced: "stroke-amber-300 dark:stroke-amber-700",
};

export default function CurriculumPage() {
  const { nodes, edges } = layoutNodes();
  const nodeMap: Record<string, Node> = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const maxX = Math.max(...nodes.map((n) => n.x + n.width)) + 40;
  const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + 40;

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
            <Map className="h-3 w-3" />
            学习路线图
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">11 门课程 · 44 章节 · 一图看清</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            节点是课程, 连线是先修关系。建议按"入门 → 进阶 → 高级"分层递进。
          </p>
        </div>
        <Link
          href="/courses/"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Compass className="h-4 w-4" />
          课程目录
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-neutral-500">层级:</span>
        {(["beginner", "intermediate", "advanced"] as const).map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: LEVEL_COLOR[l] }} />
            <span>{LEVEL_LABEL[l]}</span>
          </span>
        ))}
        <span className="ml-3 text-neutral-500">·</span>
        <span className="text-neutral-500">箭头方向: A → B 表示先学 A 再学 B</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <svg width={maxX} height={maxY} viewBox={`0 0 ${maxX} ${maxY}`} className="block">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-neutral-400 dark:fill-neutral-600" />
            </marker>
          </defs>

          {edges.map((e) => {
            const from = nodeMap[e.from];
            const to = nodeMap[e.to];
            if (!from || !to) return null;
            const x1 = from.x + from.width;
            const y1 = from.y + from.height / 2;
            const x2 = to.x;
            const y2 = to.y + to.height / 2;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={`${e.from}-${e.to}`}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                className="stroke-neutral-300 dark:stroke-neutral-700"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
            );
          })}

          {nodes.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={n.width}
                height={n.height}
                rx="10"
                className={`${LEVEL_BG[n.level]} ${LEVEL_RING[n.level]}`}
                strokeWidth="1.5"
              />
              <foreignObject x={n.x + 4} y={n.y + 4} width={n.width - 8} height={n.height - 8}>
                <div
                  className="flex h-full flex-col justify-between rounded-md p-2"
                >
                  <div>
                    <span
                      className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                      style={{ backgroundColor: LEVEL_COLOR[n.level] }}
                    >
                      {LEVEL_LABEL[n.level]}
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {n.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-600 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-2.5 w-2.5" /> {n.chapters} 章
                    </span>
                    <a
                      href={`/courses/${n.id}/`}
                      className="inline-flex items-center gap-0.5 text-primary-700 hover:underline dark:text-primary-300"
                    >
                      进入 <ArrowRight className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-4 w-4 text-primary-600" />
          推荐学习顺序
        </h2>
        <ol className="space-y-2 text-sm">
          {[
            { l: "第 1 阶段: 入门", items: ["ml-basics", "stats-foundations"], note: "建立基本概念和数学直觉" },
            { l: "第 2 阶段: 进阶", items: ["supervised-learning", "stats-probability", "stats-continuous"], note: "深入核心算法 + 概率论基础" },
            { l: "第 3 阶段: 中级", items: ["stats-estimation", "neural-networks", "reinforcement-learning"], note: "推断统计 + 神经网络 + 强化学习" },
            { l: "第 4 阶段: 高级", items: ["stats-testing", "stats-regression", "deep-learning-advanced"], note: "高级统计 + 深度学习架构" },
          ].map((s, i) => (
            <li key={i} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="mb-1 font-medium text-primary-700 dark:text-primary-300">{s.l}</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                {s.items.map((slug) => {
                  const c = nodes.find((n) => n.id === slug);
                  if (!c) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/courses/${slug}/`}
                      className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 transition hover:bg-primary-100 dark:bg-neutral-800 dark:hover:bg-primary-950/30"
                    >
                      {c.title}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-1 text-xs text-neutral-500">{s.note}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
