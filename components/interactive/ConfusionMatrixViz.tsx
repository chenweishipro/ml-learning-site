"use client";

/**
 * 混淆矩阵可视化
 * - 用户调整真实类别分布和模型预测的"倾向"
 * - 实时显示混淆矩阵
 * - 自动计算 Precision / Recall / F1
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

interface Props {
  className?: string;
}

const CLASSES = ["猫", "狗", "鸟"];
const CLASS_COLORS = ["#ef4444", "#10b981", "#3b82f6"];

export function ConfusionMatrixViz({ className }: Props) {
  // 真实样本数
  const [trueCounts, setTrueCounts] = useState([30, 30, 30]);
  // 模型的"倾向"分数: 预测为 j 的样本中, 真实为 i 的占比 (按行规范化, 0~1)
  const [confusionProbs, setConfusionProbs] = useState([
    [0.85, 0.10, 0.05], // 真实猫 → 预测 猫 85%, 狗 10%, 鸟 5%
    [0.15, 0.80, 0.05], // 真实狗
    [0.10, 0.10, 0.80], // 真实鸟
  ]);

  // 计算混淆矩阵 = 真实 * confusion 概率
  const matrix = useMemo(() => {
    return trueCounts.map((cnt, i) =>
      confusionProbs[i].map((p) => Math.round(cnt * p))
    );
  }, [trueCounts, confusionProbs]);

  // 每个真实类别的总数
  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));
  // 每个预测类别的总数
  const colTotals = matrix[0].map((_, j) => matrix.reduce((s, row) => s + row[j], 0));
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

  // Per-class metrics
  const metrics = useMemo(() => {
    return CLASSES.map((_, i) => {
      const tp = matrix[i][i];
      const fp = colTotals[i] - tp;
      const fn = rowTotals[i] - tp;
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
      return { precision, recall, f1 };
    });
  }, [matrix, rowTotals, colTotals]);

  // 整体准确率
  const accuracy = grandTotal > 0
    ? matrix.reduce((s, row, i) => s + row[i], 0) / grandTotal
    : 0;

  const updateProb = (i: number, j: number, value: number) => {
    setConfusionProbs((prev) => {
      const next = prev.map((row) => [...row]);
      next[i][j] = Math.max(0, Math.min(1, value));
      return next;
    });
  };

  const randomize = () => {
    setTrueCounts([20 + Math.floor(Math.random() * 30), 20 + Math.floor(Math.random() * 30), 20 + Math.floor(Math.random() * 30)]);
    const p = (b: number) => Math.max(0.3, Math.min(0.95, b + (Math.random() - 0.5) * 0.3));
    setConfusionProbs([
      [p(0.85), p(0.10), p(0.05)],
      [p(0.10), p(0.80), p(0.10)],
      [p(0.10), p(0.10), p(0.80)],
    ]);
  };

  const perfect = () => {
    setTrueCounts([30, 30, 30]);
    setConfusionProbs([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  };

  // 找最大值用于颜色缩放
  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <Card className={`my-6 ${className ?? ""}`}>
      <CardHeader>
        <CardTitle>📊 混淆矩阵可视化</CardTitle>
        <CardDescription>
          调整"真实类别"样本数和模型的预测概率, 观察 Precision / Recall / F1 如何变化。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* 矩阵 */}
          <div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-2"></th>
                    <th className="p-2 text-center text-xs text-neutral-500" colSpan={3}>
                      ↓ 预测为 ↓
                    </th>
                    <th className="p-2 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      真实合计
                    </th>
                  </tr>
                  <tr>
                    <th className="p-2"></th>
                    {CLASSES.map((c, j) => (
                      <th key={j} className="p-2 text-center text-xs font-semibold" style={{ color: CLASS_COLORS[j] }}>
                        预测 {c}
                      </th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {CLASSES.map((trueClass, i) => (
                    <tr key={i}>
                      <td className="p-2 text-right text-xs font-semibold" style={{ color: CLASS_COLORS[i] }}>
                        真实 {trueClass}
                      </td>
                      {CLASSES.map((_, j) => {
                        const v = matrix[i][j];
                        const intensity = v / maxVal;
                        const isCorrect = i === j;
                        return (
                          <td
                            key={j}
                            className={`p-2 text-center font-mono text-sm ${
                              isCorrect
                                ? "ring-2 ring-inset ring-accent-500/50 dark:ring-accent-400/50"
                                : ""
                            }`}
                            style={{
                              backgroundColor: isCorrect
                                ? `rgba(16, 185, 129, ${0.15 + intensity * 0.5})`
                                : `rgba(239, 68, 68, ${0.05 + intensity * 0.3})`,
                            }}
                          >
                            {v}
                          </td>
                        );
                      })}
                      <td className="p-2 text-center font-mono text-xs text-neutral-500">
                        {rowTotals[i]}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2 text-right text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      预测合计
                    </td>
                    {colTotals.map((t, j) => (
                      <td key={j} className="p-2 text-center font-mono text-xs text-neutral-500">{t}</td>
                    ))}
                    <td className="p-2 text-center font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {CLASSES.map((c, i) => (
                <div key={i} className="rounded-md border border-neutral-200 bg-white dark:bg-neutral-900 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="font-semibold" style={{ color: CLASS_COLORS[i] }}>类别 {c}</div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
                    <div>
                      <div className="text-neutral-500">P</div>
                      <div className="font-mono">{(metrics[i].precision * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">R</div>
                      <div className="font-mono">{(metrics[i].recall * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">F1</div>
                      <div className="font-mono">{(metrics[i].f1 * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Callout type={accuracy > 0.85 ? "tip" : accuracy > 0.6 ? "info" : "warning"} className="mt-4">
              <div className="text-sm">
                整体准确率: <strong>{(accuracy * 100).toFixed(1)}%</strong> ·{" "}
                宏平均 F1: <strong>{(metrics.reduce((s, m) => s + m.f1, 0) / 3 * 100).toFixed(1)}%</strong>
              </div>
            </Callout>
          </div>

          {/* 控制面板 */}
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium">真实样本数</div>
              {CLASSES.map((c, i) => (
                <div key={i} className="mb-1.5 flex items-center gap-2 text-xs">
                  <span className="w-8" style={{ color: CLASS_COLORS[i] }}>{c}</span>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={trueCounts[i]}
                    onChange={(e) => {
                      const next = [...trueCounts];
                      next[i] = Number(e.target.value);
                      setTrueCounts(next);
                    }}
                    className="flex-1"
                    style={{ accentColor: CLASS_COLORS[i] }}
                  />
                  <span className="w-8 text-right font-mono">{trueCounts[i]}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">模型预测概率 (按行规范化)</div>
              <table className="w-full text-xs">
                <tbody>
                  {CLASSES.map((_, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-2 font-medium" style={{ color: CLASS_COLORS[i] }}>
                        {CLASSES[i]}
                      </td>
                      {CLASSES.map((_, j) => (
                        <td key={j} className="px-1 py-1">
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={confusionProbs[i][j].toFixed(2)}
                            onChange={(e) => updateProb(i, j, Number(e.target.value))}
                            className="w-14 rounded border border-neutral-200 bg-white dark:bg-neutral-900 px-1.5 py-0.5 text-center font-mono text-xs dark:border-neutral-800 dark:bg-neutral-900"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button onClick={perfect} variant="outline" size="sm" className="flex-1">
                ✨ 完美模型
              </Button>
              <Button onClick={randomize} variant="ghost" size="sm" className="flex-1">
                🎲 随机
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          💡 <strong>对角线</strong>(绿色)是正确分类; <strong>非对角线</strong>(红色)是误分类。P = Precision 查准率; R = Recall 查全率; F1 = 两者的调和平均。
        </p>
      </CardContent>
    </Card>
  );
}

export default ConfusionMatrixViz;
