import type { Metadata } from "next";
import Link from "next/link";
import {
  LinearRegressionViz,
  GradientDescent,
  KMeansViz,
  ConfusionMatrixViz,
  DecisionTreeViz,
  NeuralNetPlayground,
} from "@/components/interactive";
import { Callout } from "@/components/ui/Callout";
import { Button } from "@/components/ui/Button";
import { Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "交互演示 · ML 学习站",
  description: "动手玩一玩,直观感受机器学习算法的工作原理。",
};

export default function PlaygroundPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          🎮 交互式算法演示
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          动手玩一玩,直观感受机器学习算法的工作原理
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
          调整参数,观察算法行为。所有计算在浏览器里跑,无需后端。
        </p>
        <div className="mt-4">
          <Link href="/playground/python">
            <Button variant="outline" size="sm">
              <Terminal className="h-3.5 w-3.5" />
              🐍 Python 演练场(浏览器里跑代码)
            </Button>
          </Link>
        </div>
      </header>

      <Callout type="info" className="mb-8">
        <p>
          <strong>使用方法</strong>: 拖动滑块改变参数,点"开始"看动画。试着找出让损失最小的参数组合 —— 这就是机器学习的核心思想!
        </p>
      </Callout>

      <div className="space-y-16">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">📉</span>
            <h2 className="text-2xl font-semibold">梯度下降</h2>
          </div>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            在最简单的凸函数 f(x) = x² 上看梯度下降怎么找到最小值。试试学习率太大/太小的后果。
          </p>
          <GradientDescent />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h2 className="text-2xl font-semibold">线性回归拟合</h2>
          </div>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            拖动斜率和截距,看 MSE 损失实时变化。挑战: 找到让 MSE 最小的参数。
          </p>
          <LinearRegressionViz />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="text-2xl font-semibold">K-Means 聚类</h2>
          </div>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            看 K-Means 如何把 90 个点自动分成 K 个簇。比较"随机"和"kmeans++"两种初始化。
          </p>
          <KMeansViz />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <h2 className="text-2xl font-semibold">决策树</h2>
          </div>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            经典"是否打球"数据集的决策树。点击节点查看判断流程。
          </p>
          <DecisionTreeViz />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h2 className="text-2xl font-semibold">混淆矩阵</h2>
          </div>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            调整真实类别和预测概率,观察 Precision / Recall / F1 如何变化。
          </p>
          <ConfusionMatrixViz />
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h2 className="text-2xl font-semibold">神经网络 Playground</h2>
          </div>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            选数据集 + 调网络结构, 看神经网络怎么学分类边界。浏览器里实时训练!
          </p>
          <NeuralNetPlayground />
        </section>
      </div>
    </div>
  );
}
