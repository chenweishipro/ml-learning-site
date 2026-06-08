"use client";

/**
 * 神经网络 Playground
 * - 2D 输入 (x, y)
 * - 用户选网络结构 (层数 + 每层神经元数)
 * - 实时前向计算, 显示分类决策边界
 * - 用 XOR / 圆形 / 螺旋 数据集
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

const W = 400;
const H = 400;

// ---------- 数据集生成 ----------
function randn(): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

type Dataset = "circle" | "xor" | "spiral" | "gaussian";

function generateDataset(name: Dataset, n = 200): { x: number; y: number; label: 0 | 1 }[] {
  const pts: { x: number; y: number; label: 0 | 1 }[] = [];
  if (name === "circle") {
    for (let i = 0; i < n; i++) {
      const r = Math.random() * 2;
      const t = Math.random() * Math.PI * 2;
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      const label = (r < 1 ? 0 : 1) as 0 | 1;
      pts.push({ x, y, label });
    }
  } else if (name === "xor") {
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 2;
      const label = ((x * y > 0 ? 0 : 1) ^ (Math.random() < 0.05 ? 1 : 0)) as 0 | 1;
      pts.push({ x, y, label });
    }
  } else if (name === "spiral") {
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < n / 2; i++) {
        const r = i / (n / 2);
        const t = 1.75 * i / (n / 2) + c * Math.PI;
        const x = r * Math.sin(t) + (Math.random() - 0.5) * 0.1;
        const y = r * Math.cos(t) + (Math.random() - 0.5) * 0.1;
        pts.push({ x, y, label: c as 0 | 1 });
      }
    }
  } else if (name === "gaussian") {
    for (let i = 0; i < n; i++) {
      const c = i % 2;
      const mx = c === 0 ? -0.5 : 0.5;
      const my = c === 0 ? 0.5 : -0.5;
      const x = mx + randn() * 0.4;
      const y = my + randn() * 0.4;
      pts.push({ x, y, label: c as 0 | 1 });
    }
  }
  return pts;
}

// ---------- 神经网络 ----------
type Layer = { size: number };
type Network = Layer[];

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}
function sigmoidDeriv(x: number) {
  const s = sigmoid(x);
  return s * (1 - s);
}
function tanh(x: number) {
  return Math.tanh(x);
}
function tanhDeriv(x: number) {
  return 1 - Math.tanh(x) ** 2;
}
function relu(x: number) {
  return Math.max(0, x);
}
function reluDeriv(x: number) {
  return x > 0 ? 1 : 0;
}

type Activation = "sigmoid" | "tanh" | "relu";
const ACTIVATIONS: Record<Activation, { fn: (x: number) => number; deriv: (x: number) => number }> = {
  sigmoid: { fn: sigmoid, deriv: sigmoidDeriv },
  tanh: { fn: tanh, deriv: tanhDeriv },
  relu: { fn: relu, deriv: reluDeriv },
};

interface NetState {
  weights: number[][][]; // weights[l][i][j]: from neuron j in layer l to neuron i in layer l+1
  biases: number[][];   // biases[l][i] for layer l+1 neuron i
  activations: number[][]; // activations per layer (including input)
  zs: number[][]; // pre-activation per layer
}

function initNetwork(arch: Network): NetState {
  const weights: number[][][] = [];
  const biases: number[][] = [];
  for (let l = 0; l < arch.length - 1; l++) {
    const inSize = arch[l].size;
    const outSize = arch[l + 1].size;
    const w: number[][] = [];
    const b: number[] = [];
    for (let i = 0; i < outSize; i++) {
      w.push([]);
      b.push((Math.random() - 0.5) * 0.4);
      for (let j = 0; j < inSize; j++) {
        w[i].push((Math.random() - 0.5) * (1 / Math.sqrt(inSize)));
      }
    }
    weights.push(w);
    biases.push(b);
  }
  return { weights, biases, activations: [], zs: [] };
}

function forward(state: NetState, x: number, y: number, activation: Activation): { out: number; state: NetState } {
  const { weights, biases } = state;
  const activations: number[][] = [[x, y]];
  const zs: number[][] = [];
  let prev = [x, y];
  for (let l = 0; l < weights.length; l++) {
    const z: number[] = [];
    const a: number[] = [];
    for (let i = 0; i < weights[l].length; i++) {
      let sum = biases[l][i];
      for (let j = 0; j < weights[l][i].length; j++) {
        sum += weights[l][i][j] * prev[j];
      }
      z.push(sum);
      a.push(ACTIVATIONS[activation].fn(sum));
    }
    zs.push(z);
    activations.push(a);
    prev = a;
  }
  // 输出用 sigmoid
  const out = sigmoid(prev[0]);
  return { out, state: { ...state, activations, zs } };
}

function train(state: NetState, data: { x: number; y: number; label: 0 | 1 }[], lr: number, activation: Activation): NetState {
  let totalLoss = 0;
  const accWeights: number[][][] = state.weights.map((layer) => layer.map((row) => row.map(() => 0)));
  const accBiases: number[][] = state.biases.map((layer) => layer.map(() => 0));

  for (const pt of data) {
    const { out, state: fwdState } = forward(state, pt.x, pt.y, activation);
    const label = pt.label;
    totalLoss += -(label * Math.log(out + 1e-9) + (1 - label) * Math.log(1 - out + 1e-9));
    // 反向传播
    const deltas: number[][] = [];
    // 输出层 delta (sigmoid + BCE)
    const outDelta = (out - label) * out * (1 - out);
    deltas.unshift([outDelta]);

    for (let l = fwdState.weights.length - 1; l >= 1; l--) {
      const d: number[] = [];
      for (let i = 0; i < fwdState.weights[l - 1].length; i++) {
        let sum = 0;
        for (let k = 0; k < deltas[0].length; k++) {
          sum += deltas[0][k] * fwdState.weights[l][k][i];
        }
        const z = fwdState.zs[l - 1][i];
        d.push(sum * ACTIVATIONS[activation].deriv(z));
      }
      deltas.unshift(d);
    }

    // 累积梯度
    for (let l = 0; l < fwdState.weights.length; l++) {
      for (let i = 0; i < fwdState.weights[l].length; i++) {
        for (let j = 0; j < fwdState.weights[l][i].length; j++) {
          accWeights[l][i][j] += deltas[l][i] * fwdState.activations[l][j];
        }
        accBiases[l][i] += deltas[l][i];
      }
    }
  }

  // 平均 + 应用
  const n = data.length;
  const newWeights = state.weights.map((layer, l) =>
    layer.map((row, i) => row.map((w, j) => w - (lr / n) * accWeights[l][i][j]))
  );
  const newBiases = state.biases.map((layer, l) => layer.map((b, i) => b - (lr / n) * accBiases[l][i]));

  return { weights: newWeights, biases: newBiases, activations: [], zs: [] };
}

export function NeuralNetPlayground() {
  const [arch, setArch] = useState<Network>([{ size: 2 }, { size: 4 }, { size: 1 }]);
  const [activation, setActivation] = useState<Activation>("tanh");
  const [datasetName, setDatasetName] = useState<Dataset>("circle");
  const [lr, setLr] = useState(0.1);
  const [running, setRunning] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [netState, setNetState] = useState<NetState>(() => initNetwork([{ size: 2 }, { size: 4 }, { size: 1 }]));
  const [data, setData] = useState(() => generateDataset("circle"));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 重新初始化网络当架构/激活/数据集变化
  useEffect(() => {
    setNetState(initNetwork(arch));
    setData(generateDataset(datasetName));
    setEpoch(0);
    setRunning(false);
  }, [arch, datasetName]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // 训练循环
  const step = () => {
    setNetState((s) => train(s, data, lr, activation));
    setEpoch((e) => e + 1);
  };

  const toggle = () => {
    if (running) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setRunning(true);
      intervalRef.current = setInterval(step, 30);
    }
  };

  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setNetState(initNetwork(arch));
    setData(generateDataset(datasetName));
    setEpoch(0);
  };

  // 渲染决策边界
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 画背景 (决策边界)
    const gridSize = 4;
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    for (let py = 0; py < h; py += gridSize) {
      for (let px = 0; px < w; px += gridSize) {
        // 映射到 [-1, 1]
        const x = (px / w) * 2 - 1;
        const y = -((py / h) * 2 - 1);
        const { out } = forward(netState, x, y, activation);
        // 颜色: 蓝(类0) 到 橙(类1)
        const t = out;
        const r = Math.round(59 + (245 - 59) * t);
        const g = Math.round(130 + (158 - 130) * t);
        const b = Math.round(246 + (11 - 246) * t);
        const a = 200;
        for (let dy = 0; dy < gridSize; dy++) {
          for (let dx = 0; dx < gridSize; dx++) {
            const idx = ((py + dy) * w + (px + dx)) * 4;
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = a;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // 画数据点
    data.forEach((pt) => {
      const px = ((pt.x + 1) / 2) * w;
      const py = ((1 - pt.y) / 2) * h;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = pt.label === 0 ? "rgba(255,255,255,0.9)" : "rgba(20,20,20,0.9)";
      ctx.fill();
      ctx.strokeStyle = pt.label === 0 ? "rgba(59,130,246,1)" : "rgba(245,158,11,1)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [netState, data, activation]);

  // 计算准确率
  const accuracy = useMemo(() => {
    let correct = 0;
    for (const pt of data) {
      const { out } = forward(netState, pt.x, pt.y, activation);
      const pred = out > 0.5 ? 1 : 0;
      if (pred === pt.label) correct++;
    }
    return (correct / data.length) * 100;
  }, [netState, data, activation]);

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>🧠 神经网络 Playground</CardTitle>
        <CardDescription>
          选数据集 + 调网络结构, 看神经网络怎么学分类边界。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
          {/* 画布 */}
          <div className="rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800 dark:bg-neutral-950">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="block w-full rounded-lg"
            />
            <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800">
              <span>已训练 {epoch} 轮</span>
              <span>准确率 <span className="font-mono text-accent-600 dark:text-accent-400">{accuracy.toFixed(1)}%</span></span>
            </div>
          </div>

          {/* 控制 */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">数据集</label>
              <div className="grid grid-cols-2 gap-2">
                {(["circle", "xor", "spiral", "gaussian"] as Dataset[]).map((d) => (
                  <Button
                    key={d}
                    onClick={() => setDatasetName(d)}
                    variant={datasetName === d ? "primary" : "outline"}
                    size="sm"
                  >
                    {d === "circle" && "圆形"}
                    {d === "xor" && "XOR"}
                    {d === "spiral" && "螺旋"}
                    {d === "gaussian" && "高斯"}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">网络结构</label>
              <div className="text-xs text-neutral-500">
                输入层 (2) → 隐藏层 ({arch.slice(1, -1).map((l) => l.size).join("-") || "无"}) → 输出层 (1)
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { arch: [{ size: 2 }, { size: 4 }, { size: 1 }], label: "2-4-1" },
                  { arch: [{ size: 2 }, { size: 8 }, { size: 1 }], label: "2-8-1" },
                  { arch: [{ size: 2 }, { size: 8 }, { size: 8 }, { size: 1 }], label: "2-8-8-1" },
                  { arch: [{ size: 2 }, { size: 16 }, { size: 16 }, { size: 1 }], label: "2-16-16-1" },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    onClick={() => setArch(preset.arch)}
                    variant={JSON.stringify(arch) === JSON.stringify(preset.arch) ? "primary" : "outline"}
                    size="sm"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">激活函数</label>
              <div className="flex gap-2">
                {(["sigmoid", "tanh", "relu"] as Activation[]).map((a) => (
                  <Button
                    key={a}
                    onClick={() => setActivation(a)}
                    variant={activation === a ? "primary" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    {a}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                学习率: {lr.toFixed(3)}
              </label>
              <input
                type="range"
                min={0.001}
                max={1}
                step={0.001}
                value={lr}
                onChange={(e) => setLr(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={toggle} className="flex-1" variant={running ? "outline" : "primary"}>
                {running ? "⏸ 暂停" : "▶ 开始训练"}
              </Button>
              <Button onClick={step} variant="outline" className="flex-1" disabled={running}>
                ⏭ 单步
              </Button>
              <Button onClick={reset} variant="ghost" className="flex-1">
                ⟲ 重置
              </Button>
            </div>

            <Callout type="tip">
              <p className="text-xs">
                <strong>观察</strong>: XOR 和螺旋数据需要至少 1 个隐藏层才能学好。线性可分(高斯)用 0 隐藏层就够。
              </p>
            </Callout>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NeuralNetPlayground;
