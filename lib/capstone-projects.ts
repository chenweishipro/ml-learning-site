// Capstone 实战项目 — 跨多章的端到端综合项目
// 区别于章节 quiz / coding challenge, Capstone 是"用学过的做一个完整项目"

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Domain = "ml" | "stats" | "cv" | "nlp" | "rl" | "viz";

export interface CapstoneProject {
  id: string; // slug
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  /** 主要涉及课程 + 章节, 用作"前置知识"展示 */
  prerequisites: Array<{ courseSlug: string; chapterSlug: string; title: string }>;
  /** 跨多少课程 (用来给"广度"分) */
  coursesCount: number;
  /** 估计时长 (小时) */
  hours: number;
  domain: Domain;
  /** 描述 (markdown) */
  description: string;
  /** 数据来源 (公开数据集 URL) */
  dataset: { name: string; url: string; size: string; description: string };
  /** 项目步骤 (markdown list) */
  steps: string[];
  /** 评分维度 (rubric) */
  rubric: Array<{ name: string; weight: number; description: string }>;
  /** 目标产出 */
  deliverables: string[];
  /** 推荐技术栈 */
  tech: string[];
}

export const CAPSTONE_PROJECTS: CapstoneProject[] = [
  {
    id: "titanic-survival-prediction",
    title: "泰坦尼克号生存预测",
    subtitle: "经典 Kaggle 二分类入门 — 从数据清洗到模型调参完整流程",
    difficulty: "beginner",
    domain: "ml",
    prerequisites: [
      { courseSlug: "ml-basics", chapterSlug: "first-model", title: "第一个模型: 线性回归" },
      { courseSlug: "ml-basics", chapterSlug: "model-eval", title: "模型评估" },
      { courseSlug: "supervised-learning", chapterSlug: "logistic-regression", title: "逻辑回归" },
      { courseSlug: "stats-foundations", chapterSlug: "data-types", title: "数据类型与抽样" },
    ],
    coursesCount: 3,
    hours: 4,
    dataset: {
      name: "Titanic (Kaggle)",
      url: "https://www.kaggle.com/c/titanic",
      size: "约 60 KB",
      description: "891 条训练样本 + 418 条测试样本, 12 个特征 (年龄、性别、舱位等)",
    },
    description: `经典 Kaggle 入门项目。你将完成**完整的机器学习流程**: 探索性数据分析 (EDA) → 特征工程 → 模型训练 → 交叉验证 → 超参数调优 → 集成学习 → 提交预测结果。

**核心技能**:
- 用 \`pandas\` 跟 \`matplotlib\` 探索数据
- 处理缺失值、构造新特征 (FamilySize, IsAlone, Title)
- 对比 4 种模型: 逻辑回归 / 决策树 / 随机森林 / XGBoost
- 用 \`GridSearchCV\` 调参
- 用 \`voting classifier\` 集成

**预期目标**: 排行榜前 30% (accuracy > 0.78)`,
    steps: [
      "加载数据, 用 \`.info()\` 跟 \`.describe()\` 概览",
      "EDA: 画生存率 vs 性别 / 舱位 / 年龄的柱状图",
      "缺失值处理: Age 用中位数按 Pclass+Sex 分组填充, Cabin 缺失标记为 'Missing'",
      "特征工程: 提取 Title (Mr/Mrs/Master), 创建 FamilySize, IsAlone",
      "类别编码: Sex/Embarked 用 one-hot, Title 用 target encoding",
      "建模: 4 种模型 baseline (LogReg/DecisionTree/RandomForest/XGBoost)",
      "5 折交叉验证, 比较平均 accuracy",
      "GridSearchCV 调 XGBoost 的 n_estimators / max_depth / learning_rate",
      "Stacking: 用 XGBoost + RandomForest + LogReg 做 VotingClassifier",
      "生成 test 预测提交, 上传 Kaggle 看分数",
    ],
    rubric: [
      { name: "EDA 质量", weight: 20, description: "是否有清晰的图表 + 文字洞察" },
      { name: "特征工程", weight: 25, description: "是否构造了有意义的特征 (非简单 one-hot)" },
      { name: "模型对比", weight: 20, description: "是否对比至少 3 种模型 + 交叉验证" },
      { name: "调参与集成", weight: 20, description: "是否调参 + 集成多个模型" },
      { name: "代码组织", weight: 15, description: "函数/类拆分, 可读性, 注释" },
    ],
    deliverables: [
      "Jupyter notebook (含完整流程 + 文字解读)",
      "submission.csv (Kaggle 提交格式)",
      "README.md (写清方法 + 分数)",
    ],
    tech: ["pandas", "numpy", "matplotlib", "seaborn", "scikit-learn", "xgboost"],
  },
  {
    id: "house-price-prediction",
    title: "波士顿房价预测",
    subtitle: "回归问题实战: 从特征选择到正则化, 理解偏差-方差权衡",
    difficulty: "intermediate",
    domain: "ml",
    prerequisites: [
      { courseSlug: "ml-basics", chapterSlug: "first-model", title: "第一个模型" },
      { courseSlug: "stats-foundations", chapterSlug: "explore-with-charts", title: "用图表探索数据" },
      { courseSlug: "stats-regression", chapterSlug: "correlation-regression", title: "相关与线性回归" },
      { courseSlug: "stats-regression", chapterSlug: "multiple-regression", title: "多元回归" },
    ],
    coursesCount: 3,
    hours: 6,
    dataset: {
      name: "Boston Housing (Kaggle)",
      url: "https://www.kaggle.com/c/boston-housing",
      size: "约 30 KB",
      description: "506 条样本, 13 个数值特征 + 1 个目标 (房价中位数)",
    },
    description: `经典回归问题。你将用**多元回归 + 正则化**预测波士顿郊区房价, 深入理解:
- 特征工程 (多项式 / 交叉 / 对数变换)
- 共线性检测 (VIF) 与处理
- Ridge / Lasso / ElasticNet 的差异
- **偏差-方差权衡** 跟交叉验证

**目标**: 测试集 RMSE < 3.0`,
    steps: [
      "加载数据, 画相关系数热力图, 识别强相关特征",
      "画散点图 + 拟合线, 检验线性假设",
      "用 VIF 找共线性特征, 删除或合并",
      "构造二次项 + 交叉项, 用 \`PolynomialFeatures\`",
      "对长尾特征 (LSTAT, DIS) 做对数变换",
      "基准: 普通线性回归 → 计算 train/test RMSE 跟 R²",
      "Ridge: 试 alpha=0.1, 1, 10, 100, 选最佳",
      "Lasso: 选非零特征, 解释'自动特征选择'",
      "ElasticNet: 折中 Ridge + Lasso",
      "10 折 CV 选最优模型, 评估测试集",
    ],
    rubric: [
      { name: "数据探索", weight: 15, description: "热力图/散点图/分布图齐全" },
      { name: "特征工程", weight: 25, description: "多项式 / 交叉 / 变换" },
      { name: "正则化对比", weight: 25, description: "Ridge/Lasso/ElasticNet 完整对比" },
      { name: "模型评估", weight: 20, description: "CV + 多指标" },
      { name: "结果解读", weight: 15, description: "解释 LASSO 选择的特征" },
    ],
    deliverables: ["Jupyter notebook", "RMSE 报告", "5 页 PDF 技术报告"],
    tech: ["pandas", "scikit-learn", "statsmodels", "matplotlib"],
  },
  {
    id: "movie-recommender",
    title: "电影推荐系统",
    subtitle: "协同过滤 vs 内容过滤 vs 矩阵分解, 学会评估 Top-N 推荐",
    difficulty: "intermediate",
    domain: "ml",
    prerequisites: [
      { courseSlug: "ml-basics", chapterSlug: "what-is-ml", title: "什么是机器学习" },
      { courseSlug: "ml-basics", chapterSlug: "first-model", title: "第一个模型" },
      { courseSlug: "stats-regression", chapterSlug: "multiple-regression", title: "多元回归" },
    ],
    coursesCount: 2,
    hours: 8,
    dataset: {
      name: "MovieLens 100K",
      url: "https://grouplens.org/datasets/movielens/100k/",
      size: "5 MB",
      description: "10 万条评分, 1000 用户, 1700 部电影",
    },
    description: `用三种方法实现电影推荐, 对比性能:
1. **基于物品的协同过滤** (item-item cosine)
2. **矩阵分解** (SVD, surprise 库)
3. **混合模型** (CF + 电影内容特征)

**评估指标**: RMSE + Precision@K + Recall@K + NDCG@K

**进阶**: 实现 cold-start 处理 (新用户/新电影)`,
    steps: [
      "加载 MovieLens, 用 \`surprise\` 库的 Dataset.load_builtin",
      "实现 baseline: 整体平均 / 用户平均 / 电影平均",
      "Item-CF: 物品相似度矩阵 (cosine + pearson)",
      "SVD: surprise.SVD, 调 n_factors",
      "混合: SVD 分数 + 内容特征 (类型/年代) 相似度加权",
      "5 折 CV 评估 RMSE",
      "Top-10 推荐: 用 Precision@10, Recall@10, NDCG@10",
      "Cold-start: 新用户用热门 + 内容, 新电影 fallback",
      "可视化: 用户/物品 embedding 用 t-SNE 降到 2D",
    ],
    rubric: [
      { name: "方法完整度", weight: 25, description: "至少 3 种方法实现" },
      { name: "评估方法", weight: 20, description: "RMSE + Top-N 多指标" },
      { name: "Cold-start", weight: 20, description: "新用户/新电影策略" },
      { name: "可视化", weight: 15, description: "embedding 可视化" },
      { name: "代码可读性", weight: 20, description: "OOP + 注释 + README" },
    ],
    deliverables: ["源码 (含 3 个推荐器类)", "评估脚本", "5 页报告 + 10 部电影推荐样例"],
    tech: ["pandas", "scikit-surprise", "scikit-learn", "matplotlib"],
  },
  {
    id: "sentiment-analysis-cn",
    title: "中文情感分析 (从零到部署)",
    subtitle: "中文 NLP 完整流程: jieba 分词 → TF-IDF → 分类器 → REST API",
    difficulty: "intermediate",
    domain: "nlp",
    prerequisites: [
      { courseSlug: "ml-basics", chapterSlug: "model-eval", title: "模型评估" },
      { courseSlug: "supervised-learning", chapterSlug: "logistic-regression", title: "逻辑回归" },
      { courseSlug: "supervised-learning", chapterSlug: "svm", title: "支持向量机" },
    ],
    coursesCount: 2,
    hours: 8,
    dataset: {
      name: "ChnSentiCorp / 微博情感分析",
      url: "https://github.com/SophonPlus/ChineseNlpCorpus",
      size: "20 MB",
      description: "1.2 万条酒店/电商评论, 标签: 正面/负面",
    },
    description: `从零搭建中文情感分析系统:
1. **数据预处理**: jieba 分词、去停用词
2. **特征工程**: TF-IDF / 词袋 / N-gram
3. **模型**: Naive Bayes / Logistic / SVM / 简单 MLP
4. **部署**: 用 FastAPI 暴露 REST API

**目标**: 准确率 > 88%, 推理 < 100ms/条`,
    steps: [
      "下载 ChnSentiCorp, 划分 train/val/test (8/1/1)",
      "用 jieba 分词, 加载哈工大停用词表",
      "构造 TF-IDF + ngram (1, 2), 限制 max_features=50000",
      "Baseline: Naive Bayes, 看 accuracy",
      "Logistic Regression: 调 C, 加 L2 正则",
      "Linear SVC: 用 SGD 或 LinearSVC, 调 C",
      "可选: 简单 MLP (PyTorch, 1 层 hidden)",
      "评估: 准确率 + F1 + 混淆矩阵 + ROC",
      "FastAPI: POST /predict {text: str} → {sentiment: 'pos'|'neg'}",
      "curl 测试, 写 README + 接口文档",
    ],
    rubric: [
      { name: "中文分词质量", weight: 15, description: "jieba + 自定义词典 + 停用词" },
      { name: "特征工程", weight: 20, description: "TF-IDF/N-gram/长度特征" },
      { name: "模型对比", weight: 20, description: "至少 3 种模型 + 调参" },
      { name: "API 部署", weight: 25, description: "FastAPI + 文档 + 压测" },
      { name: "代码组织", weight: 20, description: "分层 (数据/特征/模型/API) + 单测" },
    ],
    deliverables: ["完整源码", "训练好的模型 (.pkl)", "REST API 服务", "API 文档 (Swagger)"],
    tech: ["jieba", "scikit-learn", "FastAPI", "uvicorn", "pydantic"],
  },
  {
    id: "ab-test-analyzer",
    title: "A/B 测试分析器",
    subtitle: "从假设检验到贝叶斯, 给产品决策一个统计依据",
    difficulty: "intermediate",
    domain: "stats",
    prerequisites: [
      { courseSlug: "stats-probability", chapterSlug: "bayes-theorem", title: "贝叶斯定理" },
      { courseSlug: "stats-testing", chapterSlug: "hypothesis-testing-basics", title: "假设检验基础" },
      { courseSlug: "stats-testing", chapterSlug: "two-sample-tests", title: "两样本推断" },
      { courseSlug: "stats-continuous", chapterSlug: "sampling-clt", title: "抽样分布" },
    ],
    coursesCount: 3,
    hours: 6,
    dataset: {
      name: "自模拟 / Kaggle A/B 测试",
      url: "https://www.kaggle.com/datasets/zhangluyuan/ab-testing",
      size: "约 5 MB",
      description: "模拟网站新功能 A/B 测试数据, 转化率 0.12 vs 0.13",
    },
    description: `完整的 A/B 测试分析流程:

1. **实验设计**: 样本量计算, 检验功效
2. **频率派分析**: 比例 z 检验 + 置信区间
3. **贝叶斯分析**: Beta-Binomial 共轭, 后验差分布
4. **可视化**: 提升 / 置信区间 / 后验分布
5. **建议**: 用效应大小 + 风险评估做决策

**核心**: 不仅算 p 值, 要给出"业务能拿到多大收益"的估计`,
    steps: [
      "读数据, 算两组转化率 (控制组 vs 实验组)",
      "频率派: 比例 z 检验, 报告 z/p/CI/difference",
      "贝叶斯: Beta(1, 1) 先验, 用 MCMC 采样后验",
      "算'实验组 > 控制组'的后验概率 (胜率)",
      "样本量计算: 假设基线 12%, MDE 1pp, α=0.05, power=0.8, 算 n",
      "功效分析 (power analysis): 实际样本量下能检测的 MDE",
      "画图: 双柱状图 + 误差棒 + 显著星号 + 贝叶斯后验分布",
      "决策框架: 胜率 > 95%? 效应大小 > MDE? 风险可接受?",
      "写 5 页报告, 给'是否上线'的建议 + 不确定性",
    ],
    rubric: [
      { name: "频率派分析", weight: 25, description: "z 检验 + CI + 样本量计算" },
      { name: "贝叶斯分析", weight: 25, description: "Beta-Binomial + 后验" },
      { name: "可视化", weight: 20, description: "CI 图 + 后验图 + 显著标注" },
      { name: "决策建议", weight: 20, description: "不只看 p 值, 给业务建议" },
      { name: "代码可复现", weight: 10, description: "参数化, 易复用" },
    ],
    deliverables: ["Jupyter notebook", "样本量计算器", "5 页报告 + 决策矩阵"],
    tech: ["numpy", "scipy", "matplotlib", "pymc (optional)"],
  },
  {
    id: "image-classifier-cnn",
    title: "CIFAR-10 图像分类器 (PyTorch)",
    subtitle: "CNN 实战: 数据增强 + ResNet 残差 + 学习率调度, 达到 90%+ 准确率",
    difficulty: "advanced",
    domain: "cv",
    prerequisites: [
      { courseSlug: "neural-networks", chapterSlug: "perceptron", title: "感知机到神经网络" },
      { courseSlug: "neural-networks", chapterSlug: "backpropagation", title: "反向传播" },
      { courseSlug: "neural-networks", chapterSlug: "training-tips", title: "训练技巧" },
      { courseSlug: "deep-learning-advanced", chapterSlug: "cnn", title: "卷积神经网络" },
    ],
    coursesCount: 2,
    hours: 10,
    dataset: {
      name: "CIFAR-10",
      url: "https://www.cs.toronto.edu/~kriz/cifar.html",
      size: "170 MB",
      description: "6 万张 32x32 彩色图片, 10 类 (飞机/汽车/鸟…)",
    },
    description: `训练一个 CIFAR-10 分类器:
1. **Baseline CNN** (3-4 层 conv) → 70%
2. **数据增强** (flip, crop, cutout) → 80%
3. **ResNet-18** + 学习率调度 (cosine annealing) → 90%+
4. **可视化**: 训练曲线, Grad-CAM, 错误分析

**核心技能**: 不只是跑通, 要理解每个改进为什么有效`,
    steps: [
      "PyTorch + torchvision, 加载 CIFAR-10 (32x32)",
      "Baseline: 3 层 conv + 2 层 FC, Adam + cross entropy",
      "训练 30 epoch, 画 train/val 曲线",
      "数据增强: RandomCrop(32, padding=4) + RandomHorizontalFlip",
      "BatchNorm + Dropout, 重新训练, 观察提升",
      "实现 ResNet-18 (BasicBlock, 残差连接)",
      "学习率: SGD + momentum=0.9 + cosine annealing",
      "训练 100 epoch, 早停机制",
      "Grad-CAM: 可视化 CNN 关注的区域",
      "错误分析: 找出最容易混淆的 5 对类别, 讨论改进",
    ],
    rubric: [
      { name: "Baseline 完整", weight: 10, description: "能跑通 + 报告 baseline 分数" },
      { name: "数据增强", weight: 15, description: "至少 2 种增强" },
      { name: "ResNet 实现", weight: 25, description: "正确实现残差块" },
      { name: "训练技巧", weight: 20, description: "lr schedule / BN / 早停" },
      { name: "可视化分析", weight: 15, description: "训练曲线 + Grad-CAM" },
      { name: "错误分析", weight: 15, description: "找出可改进方向" },
    ],
    deliverables: ["train.py", "model.py (含 ResNet)", "训练日志 + 曲线", "5 页报告"],
    tech: ["PyTorch", "torchvision", "matplotlib", "tqdm"],
  },
];

export function getCapstoneProject(id: string): CapstoneProject | undefined {
  return CAPSTONE_PROJECTS.find((p) => p.id === id);
}
