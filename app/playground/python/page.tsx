import type { Metadata } from "next";
import { PythonRunner } from "@/components/python-runner";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata: Metadata = {
  title: "Python 演练场 · ML 学习站",
  description: "在浏览器里直接跑 Python 代码, 无需后端。",
};

const ML_SAMPLE = `# 机器学习迷你演示: 线性回归 + MSE
import math

# 训练数据: y = 3x + 2 + 噪声
true_w, true_b = 3, 2
data = [(x, true_w * x + true_b + (hash(x) % 7 - 3)) for x in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]

# 尝试不同的斜率
best_w, best_loss = 0, float('inf')
for w in [w/100 for w in range(0, 500)]:
    b = 0
    # 简单闭式解找 b
    b = sum(y - w * x for x, y in data) / len(data)
    # 计算 MSE
    loss = sum((w * x + b - y) ** 2 for x, y in data) / len(data)
    if loss < best_loss:
        best_w, best_loss = w, b

print(f"真实参数: w = {true_w}, b = {true_b}")
print(f"学到参数: w = {best_w:.2f}, b = {best_loss:.2f}")
print(f"MSE = {best_loss:.3f}")

# 预测
for x in [3, 7, 12]:
    pred = best_w * x + best_loss
    print(f"x = {x:2d}  →  y = {pred:6.2f}")
`;

export default function PythonPlaygroundPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          🐍 Python 演练场
        </h1>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
          浏览器里直接跑 Python, 无需安装, 无需后端
        </p>
      </header>

      <Callout type="info" className="mb-6">
        <p>
          <strong>技术</strong>: Pyodide (CPython 编译到 WebAssembly)。
          <strong>能力</strong>: Python 标准库 + NumPy, 速度比本地 Python 慢 3-10 倍, 但对教学足够了。
        </p>
      </Callout>

      <PythonRunner
        initialCode={ML_SAMPLE}
        title="试试看"
        description="默认是线性回归 + MSE 的迷你演示。改成你自己的代码试试。"
      />

      <div className="mt-12 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold">几个能跑的示例</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            点下面的"复制"按钮,把代码贴到上面的编辑器里运行。
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">1. NumPy 矩阵运算</h3>
          <CodeBlock>{`import numpy as np

# 创建矩阵
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print("A:")
print(A)
print("B:")
print(B)
print("A + B:")
print(A + B)
print("A @ B (矩阵乘法):")
print(A @ B)
print("A 的转置:")
print(A.T)
print("A 的行列式:", np.linalg.det(A))
print("A 的逆矩阵:")
print(np.linalg.inv(A))
`}</CodeBlock>
        </section>

        <section>
          <h3 className="text-lg font-semibold">2. 简单数据可视化 (纯文本)</h3>
          <CodeBlock>{`# 不用 matplotlib, 画个 ASCII 柱状图
data = [3, 5, 2, 8, 6, 9, 4, 7]
labels = ["A", "B", "C", "D", "E", "F", "G", "H"]

for label, v in zip(labels, data):
    bar = "█" * v
    print(f"{label} | {bar} {v}")
`}</CodeBlock>
        </section>

        <section>
          <h3 className="text-lg font-semibold">3. K-Means 聚类(纯 Python, 不调库)</h3>
          <CodeBlock>{`import random
import math

# 生成 2D 数据 (3 个簇)
random.seed(42)
data = []
for cx, cy in [(0, 0), (5, 5), (0, 5)]:
    for _ in range(20):
        data.append((cx + random.gauss(0, 0.7), cy + random.gauss(0, 0.7)))

# K-Means (K=3)
K = 3
centroids = random.sample(data, K)

for it in range(10):
    # 分配
    clusters = [[] for _ in range(K)]
    for p in data:
        dists = [math.hypot(p[0] - c[0], p[1] - c[1]) for c in centroids]
        clusters[dists.index(min(dists))].append(p)
    # 更新
    new_centroids = []
    for cluster in clusters:
        if cluster:
            mx = sum(p[0] for p in cluster) / len(cluster)
            my = sum(p[1] for p in cluster) / len(cluster)
            new_centroids.append((mx, my))
    centroids = new_centroids
    print(f"迭代 {it+1}: 簇大小 = {[len(c) for c in clusters]}")
    print(f"  质心: {[(round(c[0], 2), round(c[1], 2)) for c in centroids]}")
`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
