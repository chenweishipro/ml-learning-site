"use client";

/**
 * K-Means 聚类交互式可视化
 * - 生成 3 团高斯分布数据
 * - 用户调 K 值和初始化方式
 * - 动画展示迭代过程
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

const W = 500;
const H = 400;
const PAD = 20;

const xToScreen = (x: number) => PAD + (x / 100) * (W - 2 * PAD);
const yToScreen = (y: number) => H - PAD - (y / 100) * (H - 2 * PAD);

interface Point {
  x: number;
  y: number;
  cluster: number;
}

const CLUSTER_COLORS = [
  "#ef4444", // red
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
];

function randn(): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generateData(numClusters = 3, pointsPerCluster = 30): Point[] {
  const centers = [
    { x: 25, y: 30 },
    { x: 70, y: 25 },
    { x: 50, y: 75 },
  ];
  const data: Point[] = [];
  for (let c = 0; c < numClusters; c++) {
    const cx = centers[c % centers.length].x;
    const cy = centers[c % centers.length].y;
    for (let i = 0; i < pointsPerCluster; i++) {
      data.push({
        x: Math.max(0, Math.min(100, cx + randn() * 10)),
        y: Math.max(0, Math.min(100, cy + randn() * 10)),
        cluster: -1,
      });
    }
  }
  return data;
}

function initCentroids(points: Point[], k: number, mode: "random" | "kmeans++"): { x: number; y: number }[] {
  if (mode === "random") {
    return Array.from({ length: k }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
  }
  // kmeans++
  const centroids: { x: number; y: number }[] = [];
  centroids.push(points[Math.floor(Math.random() * points.length)]);
  while (centroids.length < k) {
    const distances = points.map((p) => {
      const minD = Math.min(
        ...centroids.map((c) => (c.x - p.x) ** 2 + (c.y - p.y) ** 2)
      );
      return minD;
    });
    const total = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    centroids.push({ x: points[idx].x, y: points[idx].y });
  }
  return centroids;
}

export function KMeansViz() {
  const [k, setK] = useState(3);
  const [initMode, setInitMode] = useState<"random" | "kmeans++">("kmeans++");
  const [data, setData] = useState<Point[]>(() => generateData(3, 30));
  const [centroids, setCentroids] = useState<{ x: number; y: number }[]>([]);
  const [running, setRunning] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const fresh = generateData(3, 30);
    setData(fresh);
    setCentroids(initCentroids(fresh, k, initMode));
    setStepCount(0);
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, initMode]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const step = () => {
    // 1. 分配点到最近的质心
    const newData = data.map((p) => {
      let minD = Infinity;
      let cluster = 0;
      centroids.forEach((c, i) => {
        const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
        if (d < minD) {
          minD = d;
          cluster = i;
        }
      });
      return { ...p, cluster };
    });
    // 2. 更新质心
    const newCentroids = centroids.map((_, i) => {
      const pts = newData.filter((p) => p.cluster === i);
      if (pts.length === 0) return centroids[i];
      const x = pts.reduce((a, p) => a + p.x, 0) / pts.length;
      const y = pts.reduce((a, p) => a + p.y, 0) / pts.length;
      return { x, y };
    });
    setData(newData);
    setCentroids(newCentroids);
    setStepCount((c) => c + 1);
  };

  const toggle = () => {
    if (running) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setRunning(true);
    intervalRef.current = setInterval(() => {
      // 通过 ref 或者 callback 检测收敛
      setData((currData) => {
        setCentroids((currCentroids) => {
          // 分配
          const newData = currData.map((p) => {
            let minD = Infinity;
            let cluster = 0;
            currCentroids.forEach((c, i) => {
              const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
              if (d < minD) {
                minD = d;
                cluster = i;
              }
            });
            return { ...p, cluster };
          });
          // 更新
          const newCentroids = currCentroids.map((_, i) => {
            const pts = newData.filter((p) => p.cluster === i);
            if (pts.length === 0) return currCentroids[i];
            return {
              x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
              y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
            };
          });
          // 检查收敛
          const moved = newCentroids.some((nc, i) => Math.abs(nc.x - currCentroids[i].x) + Math.abs(nc.y - currCentroids[i].y) > 0.5);
          if (!moved) {
            setRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          setData(newData);
          return newCentroids;
        });
        setStepCount((c) => c + 1);
        return currData;
      });
    }, 500);
  };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>🎯 K-Means 聚类可视化</CardTitle>
        <CardDescription>
          观察 K-Means 如何把数据点自动分成 K 个簇。试试不同的 K 值和初始化方式。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-2 dark:border-slate-700 dark:bg-slate-900 dark:bg-neutral-950">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
              <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="white" stroke="#cbd5e1" />
              {/* 数据点 */}
              {data.map((p, i) => (
                <circle
                  key={i}
                  cx={xToScreen(p.x)}
                  cy={yToScreen(p.y)}
                  r={4}
                  fill={p.cluster >= 0 ? CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length] : "#94a3b8"}
                  opacity={0.75}
                />
              ))}
              {/* 质心 */}
              {centroids.map((c, i) => (
                <g key={`c-${i}`}>
                  <circle cx={xToScreen(c.x)} cy={yToScreen(c.y)} r={10} fill="white" stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} strokeWidth={3} />
                  <text x={xToScreen(c.x)} y={yToScreen(c.y) + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}>
                    {i + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">K 值: {k}</label>
              <input type="range" min={2} max={6} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">初始化方式</label>
              <div className="flex gap-2">
                <Button onClick={() => setInitMode("random")} variant={initMode === "random" ? "primary" : "outline"} size="sm" className="flex-1">
                  随机
                </Button>
                <Button onClick={() => setInitMode("kmeans++")} variant={initMode === "kmeans++" ? "primary" : "outline"} size="sm" className="flex-1">
                  kmeans++
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={toggle} variant={running ? "outline" : "primary"} className="flex-1">
                {running ? "⏸ 暂停" : "▶ 开始"}
              </Button>
              <Button onClick={step} variant="outline" className="flex-1" disabled={running}>
                ⏭ 单步
              </Button>
              <Button onClick={reset} variant="ghost" className="flex-1">
                ⟲ 重置
              </Button>
            </div>
            <div className="rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:bg-neutral-900">
              已迭代: <code className="font-mono">{stepCount}</code> 步
            </div>
            <Callout type="tip">
              <p className="text-xs">
                观察: <code>kmeans++</code> 初始化通常比"随机"更快收敛,结果也更稳定(不容易陷入局部最优)。
              </p>
            </Callout>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default KMeansViz;
