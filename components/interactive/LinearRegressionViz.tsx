"use client";

/**
 * 线性回归交互式可视化
 * - 滑块控制真实直线的斜率/截距/噪声/点数
 * - 用户拖动"尝试线"的斜率和截距,实时显示 MSE
 * - 蓝色散点是数据, 红色是用户尝试的线, 绿色虚线是真实线
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

interface Props {
  initialPoints?: number;
  initialNoise?: number;
  trueSlope?: number;
  trueIntercept?: number;
}

const W = 600;
const H = 400;
const PAD = 40;
// 数据 x 范围
const X_MIN = 0;
const X_MAX = 10;
// 屏幕坐标转换
const xToScreen = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const yToScreen = (y: number, yMin: number, yMax: number) =>
  H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD);

// Box-Muller 正态分布
function randn(): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function LinearRegressionViz({
  initialPoints = 60,
  initialNoise = 1.5,
  trueSlope = 3,
  trueIntercept = 2,
}: Props) {
  const [pointCount, setPointCount] = useState(initialPoints);
  const [noise, setNoise] = useState(initialNoise);
  const [seed, setSeed] = useState(42);
  const [trySlope, setTrySlope] = useState(1);
  const [tryIntercept, setTryIntercept] = useState(0);

  // 生成数据(seed 变化或 pointCount/noise 变化时重新生成)
  const data = useMemo(() => {
    const rng = (s: number) => {
      let state = s;
      return () => {
        state = (state * 1664525 + 1013904223) % 2 ** 32;
        return state / 2 ** 32;
      };
    };
    const r = rng(seed);
    const r2 = (() => {
      let s = seed * 7919;
      return () => {
        s = (s * 1664525 + 1013904223) % 2 ** 32;
        return s / 2 ** 32;
      };
    })();
    return Array.from({ length: pointCount }, () => {
      const x = X_MIN + r() * (X_MAX - X_MIN);
      const y = trueSlope * x + trueIntercept + (randn() * noise);
      return { x, y };
    });
  }, [pointCount, noise, seed, trueSlope, trueIntercept]);

  // y 范围根据数据动态计算
  const yMin = Math.min(...data.map((d) => d.y), 0) - 2;
  const yMax = Math.max(...data.map((d) => d.y), trueSlope * X_MAX + trueIntercept + 2) + 2;

  // MSE
  const mse = useMemo(() => {
    const sum = data.reduce((acc, p) => {
      const yHat = trySlope * p.x + tryIntercept;
      return acc + (yHat - p.y) ** 2;
    }, 0);
    return sum / data.length;
  }, [data, trySlope, tryIntercept]);

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>🎯 线性回归拟合实验</CardTitle>
        <CardDescription>
          拖动滑块调整尝试直线的斜率和截距,看 MSE 如何变化。找到让 MSE 最小的线!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* 图表 */}
          <div className="rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-2 dark:border-slate-700 dark:bg-slate-900 dark:bg-neutral-950">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
              {/* 网格 */}
              <g stroke="currentColor" className="text-slate-200 dark:text-slate-700 dark:text-neutral-300" strokeWidth={1}>
                {Array.from({ length: 11 }, (_, i) => i).map((i) => (
                  <line key={`vx-${i}`} x1={xToScreen(X_MIN + i)} y1={PAD} x2={xToScreen(X_MIN + i)} y2={H - PAD} />
                ))}
                {Array.from({ length: 9 }, (_, i) => i).map((i) => {
                  const yv = yMin + (i / 8) * (yMax - yMin);
                  return <line key={`hy-${i}`} x1={PAD} y1={yToScreen(yv, yMin, yMax)} x2={W - PAD} y2={yToScreen(yv, yMin, yMax)} />;
                })}
              </g>
              {/* 坐标轴 */}
              <g stroke="currentColor" className="text-slate-500 dark:text-neutral-400 dark:text-neutral-400" strokeWidth={1.5}>
                <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} />
                <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} />
              </g>
              {/* 真实线 (绿色虚线) */}
              <line
                x1={xToScreen(X_MIN)}
                y1={yToScreen(trueSlope * X_MIN + trueIntercept, yMin, yMax)}
                x2={xToScreen(X_MAX)}
                y2={yToScreen(trueSlope * X_MAX + trueIntercept, yMin, yMax)}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              <text x={W - PAD - 10} y={yToScreen(trueSlope * X_MAX + trueIntercept, yMin, yMax) - 8} textAnchor="end" fill="#10b981" fontSize="12">
                真实线 (y = {trueSlope}x + {trueIntercept})
              </text>
              {/* 尝试线 (红色) */}
              <line
                x1={xToScreen(X_MIN)}
                y1={yToScreen(trySlope * X_MIN + tryIntercept, yMin, yMax)}
                x2={xToScreen(X_MAX)}
                y2={yToScreen(trySlope * X_MAX + tryIntercept, yMin, yMax)}
                stroke="#ef4444"
                strokeWidth={2.5}
              />
              {/* 数据点 */}
              {data.map((p, i) => (
                <circle key={i} cx={xToScreen(p.x)} cy={yToScreen(p.y, yMin, yMax)} r={3.5} fill="#3b82f6" opacity={0.65} />
              ))}
            </svg>
          </div>

          {/* 控制面板 */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">斜率 (slope): {trySlope.toFixed(2)}</label>
              <input
                type="range"
                min={-2}
                max={8}
                step={0.1}
                value={trySlope}
                onChange={(e) => setTrySlope(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">截距 (intercept): {tryIntercept.toFixed(2)}</label>
              <input
                type="range"
                min={-5}
                max={10}
                step={0.1}
                value={tryIntercept}
                onChange={(e) => setTryIntercept(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">数据点数量: {pointCount}</label>
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={pointCount}
                onChange={(e) => setPointCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">噪声大小: {noise.toFixed(1)}</label>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={noise}
                onChange={(e) => setNoise(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <Button onClick={() => setSeed((s) => s + 1)} className="w-full" variant="outline">
              🎲 重新生成数据
            </Button>
            <Callout type={mse < 3 ? "tip" : mse < 10 ? "info" : "warning"}>
              <div className="text-sm">
                <strong>MSE = {mse.toFixed(3)}</strong>
                <br />
                {mse < 1 && "完美拟合! 接近真实线。"}
                {mse >= 1 && mse < 5 && "不错的拟合,继续微调。"}
                {mse >= 5 && mse < 20 && "还能更好,试试看真实线的参数。"}
                {mse >= 20 && "差挺远,继续调整斜率和截距。"}
              </div>
            </Callout>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-neutral-400 dark:text-slate-400 dark:text-neutral-500">
          💡 提示: 真实线参数是 <code>y = {trueSlope}x + {trueIntercept}</code>。当你的红线和绿虚线完全重合时,MSE 最小。
        </p>
      </CardContent>
    </Card>
  );
}

export default LinearRegressionViz;
