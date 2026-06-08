"use client";

/**
 * 决策树可视化
 * - 用经典"是否打球"数据集
 * - 树用 SVG 绘制
 * - 用户可以点击节点分裂/合并
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";

interface TreeNode {
  id: string;
  feature?: string;
  threshold?: string;
  yes?: TreeNode;
  no?: TreeNode;
  prediction?: string;
  samples?: number;
  isLeaf?: boolean;
}

// 内置一个固定的决策树 (基于经典 PlayTennis 数据集)
const initialTree: TreeNode = {
  id: "root",
  feature: "天气",
  threshold: "晴?",
  samples: 14,
  yes: {
    id: "humidity",
    feature: "湿度",
    threshold: "< 70?",
    samples: 7,
    yes: { id: "play-yes", prediction: "✓ 打", isLeaf: true, samples: 4 },
    no: { id: "play-no", prediction: "✗ 不打", isLeaf: true, samples: 3 },
  },
  no: {
    id: "windy",
    feature: "风",
    threshold: "弱?",
    samples: 7,
    yes: { id: "play-yes2", prediction: "✓ 打", isLeaf: true, samples: 4 },
    no: { id: "play-no2", prediction: "✗ 不打", isLeaf: true, samples: 3 },
  },
};

interface Props {
  className?: string;
}

export function DecisionTreeViz({ className }: Props) {
  const [tree, setTree] = useState<TreeNode>(initialTree);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // 计算 SVG 树布局
  interface LaidOut {
    node: TreeNode;
    x: number;
    y: number;
    width: number;
  }

  const NODE_W = 130;
  const NODE_H = 50;
  const X_GAP = 20;
  const Y_GAP = 60;

  const layout = (node: TreeNode, depth: number, x: number, y: number): { nodes: LaidOut[]; totalWidth: number } => {
    if (node.isLeaf) {
      return { nodes: [{ node, x, y, width: NODE_W }], totalWidth: NODE_W };
    }
    const yesLayout = node.yes ? layout(node.yes, depth + 1, 0, y + NODE_H + Y_GAP) : { nodes: [], totalWidth: 0 };
    const noLayout = node.no ? layout(node.no, depth + 1, 0, y + NODE_H + Y_GAP) : { nodes: [], totalWidth: 0 };
    const totalWidth = Math.max(NODE_W, yesLayout.totalWidth + X_GAP + noLayout.totalWidth);
    // 重新分配 x
    const yesOffset = (totalWidth - yesLayout.totalWidth - noLayout.totalWidth) / 2;
    const noOffset = yesOffset + yesLayout.totalWidth + X_GAP;
    yesLayout.nodes.forEach((n) => (n.x = n.x + x + yesOffset));
    noLayout.nodes.forEach((n) => (n.x = n.x + x + noOffset));
    return {
      nodes: [{ node, x, y, width: NODE_W }, ...yesLayout.nodes, ...noLayout.nodes],
      totalWidth,
    };
  };

  const { nodes, totalWidth } = layout(tree, 0, 0, 0);
  const svgWidth = Math.max(totalWidth, 600);
  const maxDepth = (() => {
    let d = 0;
    const walk = (n: TreeNode, depth: number) => {
      d = Math.max(d, depth);
      if (n.yes) walk(n.yes, depth + 1);
      if (n.no) walk(n.no, depth + 1);
    };
    walk(tree, 0);
    return d;
  })();
  const svgHeight = (maxDepth + 1) * (NODE_H + Y_GAP) + 40;

  // 重新调整 x 居中
  const maxX = Math.max(...nodes.map((n) => n.x));
  const offsetX = (svgWidth - maxX - NODE_W) / 2;
  nodes.forEach((n) => (n.x = n.x + Math.max(0, offsetX)));

  const findNode = (id: string): LaidOut | undefined => nodes.find((n) => n.node.id === id);

  const isOnPath = (id: string) => selectedPath.includes(id);

  return (
    <Card className={`my-6 ${className ?? ""}`}>
      <CardHeader>
        <CardTitle>🌳 决策树可视化</CardTitle>
        <CardDescription>
          基于经典 "PlayTennis" 数据集。点击中间节点查看从根到叶的判断流程。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-auto w-full">
            {/* 画连线 */}
            {nodes.map((n) => {
              if (n.node.isLeaf) return null;
              const yesNode = n.node.yes ? findNode(n.node.yes.id) : null;
              const noNode = n.node.no ? findNode(n.node.no.id) : null;
              const lines: JSX.Element[] = [];
              const cx = n.x + NODE_W / 2;
              const cy = n.y + NODE_H;
              if (yesNode) {
                const tcx = yesNode.x + NODE_W / 2;
                const tcy = yesNode.y;
                lines.push(
                  <g key={`y-${n.node.id}`}>
                    <line x1={cx} y1={cy} x2={tcx} y2={tcy} stroke="#10b981" strokeWidth={isOnPath(n.node.id) && isOnPath(yesNode.node.id) ? 3 : 1.5} opacity={isOnPath(n.node.id) ? 0.9 : 0.5} />
                    <text x={(cx + tcx) / 2 - 12} y={(cy + tcy) / 2} fill="#10b981" fontSize="11" fontWeight="600">是</text>
                  </g>
                );
              }
              if (noNode) {
                const tcx = noNode.x + NODE_W / 2;
                const tcy = noNode.y;
                lines.push(
                  <g key={`n-${n.node.id}`}>
                    <line x1={cx} y1={cy} x2={tcx} y2={tcy} stroke="#ef4444" strokeWidth={isOnPath(n.node.id) && isOnPath(noNode.node.id) ? 3 : 1.5} opacity={isOnPath(n.node.id) ? 0.9 : 0.5} />
                    <text x={(cx + tcx) / 2 + 6} y={(cy + tcy) / 2} fill="#ef4444" fontSize="11" fontWeight="600">否</text>
                  </g>
                );
              }
              return lines;
            })}

            {/* 画节点 */}
            {nodes.map((n) => {
              const isPath = isOnPath(n.node.id);
              const fill = n.node.isLeaf
                ? n.node.prediction?.includes("✓")
                  ? "#10b981"
                  : "#ef4444"
                : "#3b82f6";
              return (
                <g
                  key={n.node.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  className="cursor-pointer"
                  onClick={() => {
                    // 选中从根到该节点的路径
                    const path: string[] = [];
                    const find = (node: TreeNode, target: string, p: string[]): boolean => {
                      const newP = [...p, node.id];
                      if (node.id === target) {
                        path.push(...newP);
                        return true;
                      }
                      if (node.yes && find(node.yes, target, newP)) return true;
                      if (node.no && find(node.no, target, newP)) return true;
                      return false;
                    };
                    find(tree, n.node.id, []);
                    setSelectedPath(path);
                  }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill={fill}
                    fillOpacity={n.node.isLeaf ? 0.85 : 0.1}
                    stroke={fill}
                    strokeWidth={isPath ? 3 : 1.5}
                  />
                  {n.node.isLeaf ? (
                    <text
                      x={NODE_W / 2}
                      y={NODE_H / 2 + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize="13"
                      fontWeight="600"
                    >
                      {n.node.prediction}
                    </text>
                  ) : (
                    <text
                      x={NODE_W / 2}
                      y={NODE_H / 2 - 4}
                      textAnchor="middle"
                      fill={isPath ? fill : "currentColor"}
                      fontSize="12"
                      fontWeight="600"
                    >
                      {n.node.feature}
                    </text>
                  )}
                  {!n.node.isLeaf && (
                    <text
                      x={NODE_W / 2}
                      y={NODE_H / 2 + 12}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="11"
                      opacity="0.7"
                    >
                      {n.node.threshold}
                    </text>
                  )}
                  {n.node.samples !== undefined && (
                    <text
                      x={NODE_W / 2}
                      y={NODE_H + 12}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="10"
                      opacity="0.5"
                    >
                      n = {n.node.samples}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-primary-600"></span>判断节点
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-accent-500"></span>✓ 决策为"打"
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-red-500"></span>✗ 决策为"不打"
          </span>
        </div>

        <Callout type="tip" className="mt-4">
          <p className="text-xs">
            💡 <strong>怎么读这棵树</strong>: 从根节点开始, 根据每个判断的"是/否"走对应分支, 直到叶节点。点击任意节点会高亮从根到该节点的路径。
          </p>
        </Callout>
      </CardContent>
    </Card>
  );
}

export default DecisionTreeViz;
