// 术语表 — 跨章节统一定义
// 用法: rehype-glossary plugin 在 MDX 渲染时自动包裹匹配 term 的文本
export interface GlossaryEntry {
  /** 术语 (主) */
  term: string;
  /** 同义词/别名 (小写比较) */
  aliases?: string[];
  /** 简明定义 (1-2 句) */
  short: string;
  /** 详细解释 (markdown, 含例子) */
  long: string;
  /** 关联章节 (slug) */
  relatedChapters?: Array<{ courseSlug: string; chapterSlug: string; title: string }>;
  /** 分类 */
  category: "ml" | "stats" | "math" | "code" | "data";
}

export const GLOSSARY: GlossaryEntry[] = [
  // ===== ML 基础 =====
  {
    term: "过拟合",
    short: "模型在训练集上表现极好, 但在新数据上表现差的现象。",
    long: `过拟合 (Overfitting) 指模型过度记住了训练数据的噪声和细节, 失去泛化能力。

**典型表现**: 训练准确率 99%, 测试准确率 60%。

**应对**:
- 收集更多数据
- 数据增强 (data augmentation)
- 降低模型复杂度 (e.g. 减少层数/参数)
- 正则化 (L1/L2/dropout)
- 早停 (early stopping)
- 集成 (ensemble)`,
    category: "ml",
    relatedChapters: [
      { courseSlug: "ml-basics", chapterSlug: "overfitting", title: "过拟合与正则化" },
    ],
  },
  {
    term: "欠拟合",
    short: "模型太简单, 在训练集和测试集上都表现差。",
    long: `欠拟合 (Underfitting) 跟过拟合相反, 模型无法捕捉数据中的规律。

**应对**: 增加模型复杂度、增加特征、减少正则化。`,
    category: "ml",
    relatedChapters: [{ courseSlug: "ml-basics", chapterSlug: "overfitting", title: "过拟合与正则化" }],
  },
  {
    term: "正则化",
    short: "通过给损失函数加惩罚项来防止过拟合。",
    long: `正则化 (Regularization) 在损失函数中加一个跟参数大小相关的项, 鼓励模型使用更小的参数。

- **L1 (Lasso)**: \\( \\lambda \\sum |w_i| \\), 倾向于产生稀疏解 (很多参数变 0)
- **L2 (Ridge)**: \\( \\lambda \\sum w_i^2 \\), 让所有参数都接近 0
- **Elastic Net**: L1 + L2 混合

\\(\\lambda\\) 是正则化强度, 越大越抑制模型复杂度。`,
    category: "ml",
  },
  {
    term: "梯度下降",
    short: "沿负梯度方向迭代更新参数以最小化损失函数。",
    long: `梯度下降 (Gradient Descent) 是最常用的优化算法。

**步骤**:
1. 随机初始化参数 \\(\\theta\\)
2. 计算损失函数 \\(L(\theta)\\) 的梯度 \\(\\nabla L\\)
3. 更新 \\(\\theta \\leftarrow \\theta - \\eta \\nabla L\\), \\(\\eta\\) 是学习率
4. 重复直到收敛

**变体**:
- **SGD**: 每次用 1 个样本
- **Mini-batch GD**: 每次用 32/64/128 个样本
- **Momentum**: 加入动量项, 加速收敛
- **Adam**: 自适应学习率, 实战首选`,
    category: "ml",
    relatedChapters: [
      { courseSlug: "ml-basics", chapterSlug: "first-model", title: "第一个模型" },
      { courseSlug: "neural-networks", chapterSlug: "training-tips", title: "训练技巧" },
    ],
  },
  {
    term: "交叉验证",
    short: "K 折交叉验证, 用 K-1 折训练, 1 折验证, 重复 K 次取平均。",
    long: `交叉验证 (Cross-Validation) 用来更稳定地评估模型。

**K 折 CV 步骤**:
1. 把数据随机分成 K 份
2. for i in 1..K: 用 K-1 份训练, 第 i 份验证, 记录分数
3. 平均 K 个分数作为最终评估

**K 的选择**: 5 或 10 最常用, K 越大越准但越慢。

**变体**: 分层 K 折 (Stratified K-Fold) 保证每折类别比例一致。`,
    category: "ml",
    relatedChapters: [{ courseSlug: "ml-basics", chapterSlug: "model-eval", title: "模型评估" }],
  },
  {
    term: "贝叶斯定理",
    short: "P(A|B) = P(B|A) · P(A) / P(B), 描述先验如何更新为后验。",
    long: `贝叶斯定理 (Bayes' Theorem) 是概率论的基石, 把先验信念和数据证据结合成后验:

$$ P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)} $$

- \\(P(A)\\): 先验 (prior), 看到数据前对 A 的信念
- \\(P(B|A)\\): 似然 (likelihood), A 发生时看到 B 的概率
- \\(P(A|B)\\): 后验 (posterior), 看到 B 后对 A 的信念

**经典例子**: 医学检测、垃圾邮件分类、ML 中的朴素贝叶斯分类器。`,
    category: "stats",
    relatedChapters: [{ courseSlug: "stats-probability", chapterSlug: "bayes-theorem", title: "贝叶斯定理" }],
  },
  {
    term: "中心极限定理",
    short: "大量独立随机变量的均值近似服从正态分布, 不管原分布是什么。",
    long: `中心极限定理 (Central Limit Theorem, CLT) 是统计学的"宇宙定律":

不论原分布是什么形状 (均匀、指数、泊松...), **样本均值** 在 n → ∞ 时趋向正态分布 \\(N(\\mu, \\sigma^2/n)\\)。

**意义**: 即使总体不是正态, 样本均值仍可做正态假设进行推断。这就是为什么 \\(t\\) 检验、\\(z\\) 检验如此常用。`,
    category: "stats",
    relatedChapters: [{ courseSlug: "stats-continuous", chapterSlug: "sampling-clt", title: "中心极限定理" }],
  },
  {
    term: "p 值",
    short: "在零假设为真时, 观测到当前结果或更极端结果的概率。",
    long: `p 值 (p-value) 是假设检验的核心:

- **p < 0.05** (常用阈值): 拒绝零假设, 认为效应"统计显著"
- **p ≥ 0.05**: 不能拒绝零假设, 不是"接受"零假设

**常见误解**:
- p 值不是"零假设为真的概率"
- p 值不是"效应大小的度量"
- p 值小不代表效应重要 (大样本下任何小差异都显著)

**更好的做法**: 报告效应大小 + 置信区间, 不只看 p 值。`,
    category: "stats",
    relatedChapters: [{ courseSlug: "stats-testing", chapterSlug: "hypothesis-testing-basics", title: "假设检验基础" }],
  },
  {
    term: "置信区间",
    short: "在置信水平 (如 95%) 下, 包含真实参数值的区间。",
    long: `置信区间 (Confidence Interval) 提供参数估计的不确定性度量。

**95% CI 的含义**: 如果重复抽样 100 次, 每次构造一个 CI, 大约 95 个会包含真实参数。

**常见 CI**:
- 均值: \\(\\bar{x} \\pm t_{\\alpha/2, n-1} \\cdot s/\\sqrt{n}\\)
- 比例: \\(\\hat{p} \\pm z_{\\alpha/2} \\sqrt{\\hat{p}(1-\\hat{p})/n}\\)
- 回归系数: \\(\\hat{\\beta} \\pm t \\cdot SE(\\hat{\\beta})\\)

**CI 越窄 → 估计越精确** (大样本、小方差可缩窄)。`,
    category: "stats",
    relatedChapters: [{ courseSlug: "stats-estimation", chapterSlug: "ci-mean-proportion", title: "置信区间" }],
  },
  {
    term: "方差",
    short: "衡量数据离散程度, 等于平方偏差的平均。",
    long: `方差 (Variance) \\(\\sigma^2 = \\frac{1}{n}\\sum (x_i - \\bar{x})^2\\)

**特性**:
- 永远 ≥ 0
- 单位是原数据单位的平方 (所以常用标准差)

**样本方差** (无偏估计): \\(s^2 = \\frac{1}{n-1}\\sum (x_i - \\bar{x})^2\\) (除以 n-1)。`,
    category: "stats",
    relatedChapters: [{ courseSlug: "stats-foundations", chapterSlug: "descriptive-stats", title: "描述统计" }],
  },
  {
    term: "标准差",
    short: "方差的平方根, 跟原数据同单位, 衡量离散程度。",
    long: `标准差 (Standard Deviation) \\(\\sigma = \\sqrt{\\text{Variance}}\\)

**正态分布经验法则 (68-95-99.7)**:
- 68% 数据在均值 ±1σ 内
- 95% 数据在均值 ±2σ 内
- 99.7% 数据在均值 ±3σ 内`,
    category: "stats",
    relatedChapters: [{ courseSlug: "stats-foundations", chapterSlug: "descriptive-stats", title: "描述统计" }],
  },
  {
    term: "正态分布",
    short: "钟形对称分布, 由均值 μ 和标准差 σ 完全描述。",
    long: `正态分布 (Normal Distribution) 是最常见的连续分布:

$$ f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}} $$

- **对称**: 均值 = 中位数 = 众数
- **钟形**: 单峰, 渐近 x 轴
- **参数**: \\(\\mu\\) (位置), \\(\\sigma\\) (形状)

**重要性**: 中心极限定理保证样本均值趋向正态。`,
    category: "stats",
    relatedChapters: [{ courseSlug: "stats-continuous", chapterSlug: "normal-distribution", title: "正态分布" }],
  },
  {
    term: "RAG",
    short: "Retrieval-Augmented Generation, 检索增强生成, 给 LLM 喂相关文档再回答。",
    long: `RAG (检索增强生成) 解决 LLM 幻觉和知识陈旧问题:

**流程**:
1. 用户提问
2. 向量检索找出最相关的 3-5 个文档片段
3. 把这些片段 + 问题拼成 prompt
4. LLM 基于片段生成答案 (附引用)

**优势**: 答案可追溯、可用私有知识、Token 成本低。`,
    category: "ml",
  },
  {
    term: "Embedding",
    short: "把文字/图片/音频映射到连续向量空间, 相似语义距离近。",
    long: `Embedding 把离散对象 (单词/句子/图片) 映射到稠密向量 (e.g. 768/1536 维):

- **Word2Vec/GloVe**: 静态词向量
- **BERT Embeddings**: 上下文相关
- **OpenAI text-embedding-3**: 1536 维, 闭源
- **Sentence-BERT**: 句子级

**应用**: 语义搜索、推荐系统、RAG。语义相近的文本在向量空间中距离近 (cosine similarity)。`,
    category: "ml",
  },
  {
    term: "Pyodide",
    short: "把 CPython 编译到 WebAssembly, 在浏览器里跑 Python。",
    long: `Pyodide 是 Python 3.11 → WASM 的编译版本, 让 Python 在浏览器中无需后端运行。

**用途**:
- 教学平台 (学生直接跑代码)
- 客户端 ML 推理
- 数据科学演示

**限制**: 比原生 Python 慢 2-5 倍, 不支持全部 C 扩展。`,
    category: "code",
  },
  {
    term: "Monaco Editor",
    short: "VS Code 用的开源代码编辑器, 支持语法高亮 / 智能补全 / 调试。",
    long: `Monaco Editor 是 VS Code 的核心编辑器, 由 Microsoft 开源。

**特性**:
- 100+ 语言语法高亮
- 智能补全 (IntelliSense)
- 跳转到定义
- 多光标 / 格式化 / diff

**应用**: 在线 IDE、文档站 (本平台用它做 Python 演练场)。`,
    category: "code",
  },
];

export function lookupGlossary(term: string): GlossaryEntry | undefined {
  const t = term.toLowerCase().trim();
  return GLOSSARY.find(
    (e) => e.term.toLowerCase() === t || e.aliases?.some((a) => a.toLowerCase() === t)
  );
}

export const GLOSSARY_CATEGORIES: Record<string, string> = {
  ml: "机器学习",
  stats: "统计学",
  math: "数学",
  code: "编程",
  data: "数据",
};
