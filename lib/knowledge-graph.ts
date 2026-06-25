/** v17.1 知识图谱 — 课程/章节前置依赖图 */

import { courses as ALL_COURSES } from "@/content/courses/_index";

export type NodeKind = "course" | "chapter";
export type Level = "beginner" | "intermediate" | "advanced";

export interface KGNode {
  id: string;            // 唯一 id: "course:slug" 或 "chapter:slug"
  kind: NodeKind;
  slug: string;
  courseSlug: string;
  title: string;
  level: Level;
  duration?: string;     // 章节时长
  description?: string;
  /** 图布局坐标 (由 layout 函数生成) */
  x?: number;
  y?: number;
  /** 拓扑层级 (0 = 起点, 越大越深) */
  layer?: number;
}

export interface KGEdge {
  from: string;
  to: string;
}

/** 硬编码课程间前置依赖 */
const COURSE_DEPS: Array<[string, string]> = [
  // ML 主线
  ["ml-basics", "supervised-learning"],
  ["supervised-learning", "neural-networks"],
  ["neural-networks", "deep-learning-advanced"],
  ["deep-learning-advanced", "llm-basics"],
  ["deep-learning-advanced", "cv-basics"],
  ["neural-networks", "cv-basics"],
  ["ml-basics", "cv-basics"],
  ["neural-networks", "gnn-basics"],
  ["ml-basics", "gnn-basics"],
  ["ml-basics", "recsys"],
  ["supervised-learning", "recsys"],
  ["neural-networks", "mlops"],
  ["ml-basics", "nlp-basics"],
  ["ml-basics", "time-series"],
  ["neural-networks", "reinforcement-learning"],
  // 统计主线
  ["stats-foundations", "stats-probability"],
  ["stats-probability", "stats-continuous"],
  ["stats-continuous", "stats-estimation"],
  ["stats-estimation", "stats-testing"],
  ["stats-testing", "stats-regression"],
  // 统计 ↔ ML 互通
  ["stats-foundations", "ml-basics"],
  ["stats-testing", "supervised-learning"],
  ["stats-regression", "supervised-learning"],
];

/** 课程章节内的自然顺序 */
function chapterSequentialEdges(courseSlug: string, chapterSlugs: string[]): KGEdge[] {
  const edges: KGEdge[] = [];
  for (let i = 0; i < chapterSlugs.length - 1; i++) {
    edges.push({ from: `chapter:${courseSlug}/${chapterSlugs[i]}`, to: `chapter:${courseSlug}/${chapterSlugs[i + 1]}` });
  }
  return edges;
}

export function getNodes(): KGNode[] {
  const nodes: KGNode[] = [];
  for (const c of ALL_COURSES) {
    nodes.push({
      id: `course:${c.slug}`,
      kind: "course",
      slug: c.slug,
      courseSlug: c.slug,
      title: c.title,
      level: c.level,
      description: c.description,
    });
    for (const ch of c.chapters) {
      nodes.push({
        id: `chapter:${c.slug}/${ch.slug}`,
        kind: "chapter",
        slug: `${c.slug}/${ch.slug}`,
        courseSlug: c.slug,
        title: ch.title,
        level: c.level,
        duration: ch.duration,
        description: ch.description,
      });
    }
  }
  return nodes;
}

export function getEdges(): KGEdge[] {
  const edges: KGEdge[] = [];
  // 课程间
  for (const [from, to] of COURSE_DEPS) {
    edges.push({ from: `course:${from}`, to: `course:${to}` });
  }
  // 章节内顺序
  for (const c of ALL_COURSES) {
    const slugs = c.chapters.map((ch) => ch.slug);
    edges.push(...chapterSequentialEdges(c.slug, slugs));
    // 第一章 → 父课程 (隐式前置)
    if (slugs.length > 0) {
      edges.push({ from: `course:${c.slug}`, to: `chapter:${c.slug}/${slugs[0]}` });
    }
    // 最后一章 → 后续课程第一章节 (隐式连接, 帮助布局)
    // 不做这个, 避免视觉混乱
  }
  return edges;
}

/** 计算拓扑层级 (BFS) */
export function computeLayers(nodes: KGNode[], edges: KGEdge[]): Map<string, number> {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
    adj.get(e.from)?.push(e.to);
  }
  const layers = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      layers.set(id, 0);
      queue.push(id);
    }
  }
  while (queue.length > 0) {
    const id = queue.shift()!;
    const layer = layers.get(id) ?? 0;
    for (const next of adj.get(id) ?? []) {
      const nextDeg = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, nextDeg);
      const nextLayer = layers.get(next);
      if (nextLayer === undefined || layers.get(id)! + 1 > nextLayer) {
        layers.set(next, layers.get(id)! + 1);
      }
      if (nextDeg === 0) queue.push(next);
    }
  }
  // 没分配的节点 layer = max + 1
  const maxLayer = Math.max(0, ...Array.from(layers.values()));
  for (const n of nodes) {
    if (!layers.has(n.id)) layers.set(n.id, maxLayer + 1);
  }
  return layers;
}

/** 计算布局坐标 (分层布局) */
export function layoutGraph(width: number, height: number): { nodes: KGNode[]; layers: Map<string, number> } {
  const nodes = getNodes();
  const edges = getEdges();
  const layers = computeLayers(nodes, edges);

  // 按 (layer, kind, courseSlug) 分组
  const byLayer = new Map<number, KGNode[]>();
  for (const n of nodes) {
    const l = layers.get(n.id) ?? 0;
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l)!.push(n);
  }
  const maxLayer = Math.max(0, ...Array.from(byLayer.keys()));

  const margin = 80;
  const usableW = width - 2 * margin;
  const usableH = height - 2 * margin;
  const layerGap = maxLayer > 0 ? usableW / Math.max(maxLayer, 1) : usableW;

  for (const [layer, layerNodes] of byLayer) {
    // 课程先排, 章节后
    layerNodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "course" ? -1 : 1;
      if (a.courseSlug !== b.courseSlug) return a.courseSlug.localeCompare(b.courseSlug);
      return a.slug.localeCompare(b.slug);
    });
    const n = layerNodes.length;
    const yGap = n > 1 ? usableH / (n - 1) : 0;
    layerNodes.forEach((node, i) => {
      node.x = margin + layer * layerGap;
      node.y = margin + i * yGap;
      node.layer = layer;
    });
  }

  return { nodes, layers };
}

/** 找出节点的前置 (所有入边源) 和后续 (所有出边目标) */
export function getNeighbors(nodeId: string, edges: KGEdge[]): { prerequisites: string[]; successors: string[] } {
  const prerequisites: string[] = [];
  const successors: string[] = [];
  for (const e of edges) {
    if (e.to === nodeId) prerequisites.push(e.from);
    if (e.from === nodeId) successors.push(e.to);
  }
  return { prerequisites, successors };
}

/** 课程色卡 (与 CoursePreview 一致风格) */
export const NODE_COLORS: Record<string, string> = {
  "ml-basics": "#0ea5e9",
  "supervised-learning": "#6366f1",
  "neural-networks": "#8b5cf6",
  "deep-learning-advanced": "#a855f7",
  "reinforcement-learning": "#f59e0b",
  "stats-foundations": "#10b981",
  "stats-probability": "#14b8a6",
  "stats-continuous": "#06b6d4",
  "stats-estimation": "#0ea5e9",
  "stats-testing": "#3b82f6",
  "stats-regression": "#6366f1",
  "nlp-basics": "#ec4899",
  "time-series": "#f43f5e",
  "mlops": "#84cc16",
  "recsys": "#f97316",
  "cv-basics": "#d946ef",
  "gnn-basics": "#0891b2",
  "llm-basics": "#a855f7",
};
