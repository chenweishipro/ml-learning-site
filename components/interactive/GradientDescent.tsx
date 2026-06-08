"use client";

/**
 * 梯度下降可视化
 * - 在 f(x) = x^2 上做梯度下降
 * - 滑块控制学习率和起始点
 * - 显示每一步的位置和损失
 */

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

const W = 600;
const H = 360;
const PAD = 40;
const X_MIN = -5;
const X_MAX = 5;
const Y_MIN = 0;
const Y_MAX = 25;

const xToScreen = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const yToScreen = (y: number) => H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);

const f = (x: number) => x * x;
const fGrad = (x: number) => 2 * x;

export function GradientDescent() {
  const [learningRate, setLearningRate] = useState(0.1);
  const [startX, setStartX] = useState(4);
  const [currentX, setCurrentX] = useState(4);
  const [trail, setTrail] = useState<number[]>([4]);
  const [running, setRunning] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 绘制函数曲线的采样点
  const curvePoints: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
    const y = f(x);
    curvePoints.push(`${i === 0 ? "M" : "L"} ${xToScreen(x)} ${yToScreen(y)}`);
  }
  const curvePath = curvePoints.join(" ");

  // 重置
  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentX(startX);
    setTrail([startX]);
    setStepCount(0);
  };

  // 学习率或起始点变化时, 重置
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningRate, startX]);

  // 单步
  const step = () => {
    setCurrentX((x) => {
      const next = x - learningRate * fGrad(x);
      setTrail((t) => [...t, next]);
      setStepCount((c) => c + 1);
      return next;
    });
  };

  // 启动 / 暂停
  const toggle = () => {
    if (running) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setCurrentX((x) => {
        const next = x - learningRate * fGrad(x);
        setStepCount((c) => c + 1);
        setTrail((t) => [...t, next]);
        if (Math.abs(next) < 0.001 || Math.abs(next) > 50) {
          setRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return x;
        }
        return next;
      });
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>📉 梯度下降可视化</CardTitle>
        <CardDescription>
          观察算法如何在 f(x) = x² 上找到最小值。试试不同的学习率和起始点!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-2 dark:border-slate-700 dark:bg-slate-900 dark:bg-neutral-950">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
              <g stroke="currentColor" className="text-slate-300 dark:text-slate-700 dark:text-neutral-300" strokeWidth={1}>
                {Array.from({ length: 11 }, (_, i) => i - 5).map((i) => (
                  <line key={`vx-${i}`} x1={xToScreen(i)} y1={PAD} x2={xToScreen(i)} y2={H - PAD} />
                ))}
                {Array.from({ length: 6 }, (_, i) => i * 5).map((i) => (
                  <line key={`hy-${i}`} x1={PAD} y1={yToScreen(i)} x2={W - PAD} y2={yToScreen(i)} />
                ))}
              </g>
              <g stroke="currentColor" className="text-slate-500 dark:text-neutral-400 dark:text-neutral-400" strokeWidth={1.5}>
                <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} />
                <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} />
              </g>
              <path d={curvePath} fill="none" stroke="#6366f1" strokeWidth={2.5} />

              {/* 轨迹线 */}
              {trail.length > 1 && (
                <polyline
                  points={trail.map((x) => `${xToScreen(x)},${yToScreen(f(x))}`).join(" ")}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  opacity={0.6}
                />
              )}

              {/* 当前位置 */}
              <circle cx={xToScreen(currentX)} cy={yToScreen(f(currentX))} r={8} fill="#ef4444" />
              <circle cx={xToScreen(currentX)} cy={yToScreen(f(currentX))} r={14} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.4} />

              {/* 起点标记 */}
              <circle cx={xToScreen(startX)} cy={yToScreen(f(startX))} r={5} fill="#10b981" />

              {/* 标签 */}
              <text x={W - PAD - 5} y={H - 10} textAnchor="end" fill="currentColor" fontSize="11">x</text>
              <text x={10} y={PAD + 5} fill="currentColor" fontSize="11">f(x)</text>
            </svg>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">学习率 (lr): {learningRate.toFixed(3)}</label>
              <input
                type="range"
                min={0.001}
                max={1.2}
                step={0.001}
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 dark:text-neutral-400">{learningRate < 0.05 ? "太慢, 需要很多步" : learningRate > 1 ? "太大, 会发散" : "刚好"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">起始点: {startX.toFixed(2)}</label>
              <input
                type="range"
                min={-4.5}
                max={4.5}
                step={0.1}
                value={startX}
                onChange={(e) => setStartX(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={toggle} className="flex-1" variant={running ? "outline" : "primary"}>
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
              <div>当前 x: <code className="font-mono">{currentX.toFixed(4)}</code></div>
              <div>当前 f(x): <code className="font-mono">{f(currentX).toFixed(4)}</code></div>
              <div>已迭代: <code className="font-mono">{stepCount}</code> 步</div>
            </div>
            <Callout type="info">
              <p className="text-xs">
                观察: 学习率过大(如 1.0)时, x 会在 0 附近反复横跳甚至爆炸; 学习率过小(如 0.01)时, 收敛很慢。
              </p>
            </Callout>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GradientDescent;
