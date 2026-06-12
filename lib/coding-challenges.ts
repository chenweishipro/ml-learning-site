// 编程题 — 跟 Quiz 类似, 但需要写代码 + 跑测试
// 测试在 Pyodide 中跑 (前端), 不需要后端 sandbox

export interface CodingTest {
  /** 测试名 (输出显示) */
  name: string;
  /** 测试代码: 应当 raise AssertionError if fail */
  code: string;
  /** 隐藏: 不显示在题目里 */
  hidden?: boolean;
}

export interface CodingChallenge {
  /** 唯一 ID, e.g. "ml-basics/first-model/linear-regression-fit" */
  id: string;
  /** 课程 slug */
  courseSlug: string;
  /** 章节 slug */
  chapterSlug: string;
  /** 题目标题 */
  title: string;
  /** 题目描述 (markdown) */
  description: string;
  /** 难度: easy / medium / hard */
  difficulty: "easy" | "medium" | "hard";
  /** 初始代码 (用户编辑) */
  starterCode: string;
  /** 参考解 (admin only 可见) */
  solution: string;
  /** 测试 (跑通过即正确) */
  tests: CodingTest[];
  /** 提示 */
  hints?: string[];
}

export const CODING_CHALLENGES: CodingChallenge[] = [
  // ===== ml-basics/first-model =====
  {
    id: "ml-basics/first-model/mean-of-list",
    courseSlug: "ml-basics",
    chapterSlug: "first-model",
    title: "实现列表的平均值",
    description: `实现 \`mean(nums)\` 函数, 返回数字列表的平均值。

**示例**:
- \`mean([1, 2, 3, 4, 5])\` 应返回 \`3.0\`
- \`mean([10])\` 应返回 \`10.0\`
- 空列表返回 \`0.0\``,
    difficulty: "easy",
    starterCode: `def mean(nums):
    # TODO: 返回 nums 的平均值
    pass
`,
    solution: `def mean(nums):
    if not nums:
        return 0.0
    return sum(nums) / len(nums)
`,
    tests: [
      { name: "基本用法", code: "assert mean([1,2,3,4,5]) == 3.0" },
      { name: "单元素", code: "assert mean([10]) == 10.0" },
      { name: "空列表", code: "assert mean([]) == 0.0" },
      { name: "浮点数", code: "assert abs(mean([1, 2]) - 1.5) < 1e-9" },
    ],
  },
  {
    id: "ml-basics/first-model/rmse",
    courseSlug: "ml-basics",
    chapterSlug: "first-model",
    title: "实现 RMSE (均方根误差)",
    description: `实现 \`rmse(y_true, y_pred)\`, 返回预测值与真实值之间的均方根误差。

**公式**: \\( \\text{RMSE} = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2} \\)

**示例**:
- \`rmse([1,2,3], [1,2,3])\` 应返回 \`0.0\`
- \`rmse([1,2,3], [2,2,2])\` 应返回 \`0.816...\` (约 √(2/3))`,
    difficulty: "easy",
    starterCode: `import math

def rmse(y_true, y_pred):
    # TODO: 返回 RMSE
    pass
`,
    solution: `import math

def rmse(y_true, y_pred):
    n = len(y_true)
    if n == 0:
        return 0.0
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(y_true, y_pred)) / n)
`,
    tests: [
      { name: "完美预测", code: "assert rmse([1,2,3], [1,2,3]) == 0.0" },
      { name: "常数差", code: "assert abs(rmse([1,2,3], [2,2,2]) - (2/3)**0.5) < 1e-9" },
      { name: "空列表", code: "assert rmse([], []) == 0.0" },
    ],
  },

  // ===== ml-basics/model-eval =====
  {
    id: "ml-basics/model-eval/confusion-stats",
    courseSlug: "ml-basics",
    chapterSlug: "model-eval",
    title: "混淆矩阵: 精度 / 召回 / F1",
    description: `实现 \`precision_recall_f1(tp, fp, fn, tn)\`, 返回字典 \`{"precision": ..., "recall": ..., "f1": ...}\`。

**公式**:
- 精度 = TP / (TP + FP)
- 召回 = TP / (TP + FN)
- F1 = 2 * P * R / (P + R)

当分母为 0 时返回 0。`,
    difficulty: "medium",
    starterCode: `def precision_recall_f1(tp, fp, fn, tn):
    # TODO
    return {"precision": 0, "recall": 0, "f1": 0}
`,
    solution: `def precision_recall_f1(tp, fp, fn, tn):
    p = tp / (tp + fp) if (tp + fp) > 0 else 0
    r = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0
    return {"precision": p, "recall": r, "f1": f1}
`,
    tests: [
      { name: "完美分类", code: "r = precision_recall_f1(50, 0, 0, 50); assert r['precision'] == 1.0 and r['recall'] == 1.0 and r['f1'] == 1.0" },
      { name: "全错", code: "r = precision_recall_f1(0, 50, 50, 0); assert r['precision'] == 0 and r['recall'] == 0 and r['f1'] == 0" },
      { name: "部分对", code: "r = precision_recall_f1(40, 10, 20, 30); assert abs(r['precision'] - 0.8) < 1e-9 and abs(r['recall'] - 2/3) < 1e-9" },
    ],
  },

  // ===== stats-foundations/descriptive-stats =====
  {
    id: "stats-foundations/descriptive-stats/standardize",
    courseSlug: "stats-foundations",
    chapterSlug: "descriptive-stats",
    title: "标准化 (z-score)",
    description: `实现 \`standardize(xs)\`, 返回每个元素减去均值后除以标准差的结果。

**公式**: \\( z_i = \\frac{x_i - \\mu}{\\sigma} \\)

**注意**: 标准差用**总体标准差** (除以 N, 不是 N-1)。`,
    difficulty: "medium",
    starterCode: `def standardize(xs):
    # TODO
    pass
`,
    solution: `def standardize(xs):
    if not xs:
        return []
    n = len(xs)
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / n
    sd = var ** 0.5
    if sd == 0:
        return [0.0] * n
    return [(x - mean) / sd for x in xs]
`,
    tests: [
      { name: "标准输入", code: "r = standardize([1, 2, 3, 4, 5]); assert all(abs(v) < 1e-9 for v in [r[0]+1.4142135, r[1]+0.7071067, r[2], r[3]-0.7071067, r[4]-1.4142135])" },
      { name: "空列表", code: "assert standardize([]) == []" },
      { name: "全相同", code: "assert standardize([5, 5, 5]) == [0.0, 0.0, 0.0]" },
    ],
  },
];

export function getCodingChallenge(id: string): CodingChallenge | undefined {
  return CODING_CHALLENGES.find((c) => c.id === id);
}

export function getChapterChallenges(courseSlug: string, chapterSlug: string): CodingChallenge[] {
  return CODING_CHALLENGES.filter((c) => c.courseSlug === courseSlug && c.chapterSlug === chapterSlug);
}
