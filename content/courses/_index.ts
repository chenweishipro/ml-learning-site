/**
 * 课程元数据集中索引
 *
* 5 门 ML 课 (23 章) + 6 门统计课 (14 章) + 3 门 v13.1 新课 (11 章) + 1 门 v14.1 新课 (4 章) + 1 门 v15.1 新课 (4 章) = 16 门课, 56 章
 *
 * 数据来源:
 * - 5 门 ML 课: 自研内容
 * - 6 门统计课: 来自《基础统计学》第 14 版 (Mario F. Triola, 钱辰江/潘文皓 译, 电子工业出版社)
 */

export type Level = "beginner" | "intermediate" | "advanced";

export interface ChapterMeta {
  slug: string;
  title: string;
  description: string;
  duration: string;
}

export interface CourseMeta {
  slug: string;
  title: string;
  description: string;
  level: Level;
  duration: string;
  cover?: string;
  tags?: string[];
  author?: string;
  chapters: ChapterMeta[];
}

export const courses: CourseMeta[] = [
  /* ============== 5 门机器学习课程 ============== */
  {
    slug: "ml-basics",
    title: "机器学习入门",
    description: "从零开始理解机器学习的核心概念、关键术语与基础算法。零基础友好,讲清楚每一个直觉。",
    level: "beginner",
    duration: "约 6 小时",
    tags: ["入门", "监督学习", "sklearn", "Python"],
    author: "ML 学习站",
    chapters: [
      { slug: "what-is-ml", title: "什么是机器学习", description: "机器学习的定义、与传统编程的区别、四类典型应用。", duration: "20 分钟" },
      { slug: "ml-types", title: "机器学习的分类", description: "监督 / 无监督 / 半监督 / 强化学习,各举 3 个例子。", duration: "25 分钟" },
      { slug: "first-model", title: "第一个模型:线性回归", description: "数学原理、最小二乘法、sklearn 三行代码上手。", duration: "30 分钟" },
      { slug: "model-eval", title: "如何评估模型", description: "训练/测试集划分、交叉验证、回归与分类常用指标。", duration: "30 分钟" },
      { slug: "overfitting", title: "过拟合与欠拟合", description: "高方差与高偏差的直觉图解与 5 种解决方案。", duration: "25 分钟" },
      // === v8.8 新增: 统计补充章 ===
      { slug: "eda-for-ml", title: "数据预处理与探索性分析 (EDA)", description: "用统计图表 + 集中趋势/离散度 指标快速摸清一份数据的样子。", duration: "30 分钟" },
    ],
  },
  {
    slug: "supervised-learning",
    title: "监督学习进阶",
    description: "在掌握线性回归之后,深入 4 类主流监督学习算法,理解它们各自擅长什么、什么时候该用。",
    level: "intermediate",
    duration: "约 5 小时",
    tags: ["监督学习", "分类", "sklearn", "XGBoost"],
    author: "ML 学习站",
    chapters: [
      { slug: "logistic-regression", title: "逻辑回归", description: "从线性到 sigmoid、二分类原理与正则化。", duration: "30 分钟" },
      { slug: "decision-trees", title: "决策树", description: "信息熵、ID3/C4.5 概念、树的剪枝与可视化。", duration: "35 分钟" },
      { slug: "svm", title: "支持向量机", description: "最大间隔、核函数、SVM 在非线性问题上的威力。", duration: "30 分钟" },
      { slug: "ensemble", title: "集成学习", description: "Bagging、Boosting、Random Forest 与 XGBoost 思想。", duration: "30 分钟" },
      // === v8.8 新增: 统计补充章 ===
      { slug: "hypothesis-testing", title: "假设检验与 A/B 测试", description: "用 p 值、置信区间判断两个模型/两组实验的差异是否显著。", duration: "35 分钟" },
    ],
  },
  {
    slug: "neural-networks",
    title: "神经网络与深度学习入门",
    description: "从感知机到多层网络,搞懂反向传播的链式法则、激活函数与损失函数,以及训练神经网络的实用技巧。",
    level: "intermediate",
    duration: "约 5 小时",
    tags: ["深度学习", "神经网络", "PyTorch", "反向传播"],
    author: "ML 学习站",
    chapters: [
      { slug: "perceptron", title: "从感知机到神经网络", description: "神经元数学模型、多层感知机结构。", duration: "25 分钟" },
      { slug: "backpropagation", title: "反向传播算法", description: "链式法则、计算图、手推一个两层网络。", duration: "35 分钟" },
      { slug: "activation-loss", title: "激活函数与损失函数", description: "ReLU / Sigmoid / Softmax 与交叉熵的搭配。", duration: "25 分钟" },
      { slug: "training-tips", title: "训练神经网络的技巧", description: "初始化、学习率、BatchNorm、Dropout、正则化。", duration: "30 分钟" },
    ],
  },
  {
    slug: "deep-learning-advanced",
    title: "深度学习进阶",
    description: "从 CNN 到 Transformer,理解现代深度学习的核心架构。适合已经掌握神经网络基础、想进一步的同学。",
    level: "advanced",
    duration: "约 7 小时",
    tags: ["深度学习", "CNN", "RNN", "Transformer"],
    author: "ML 学习站",
    chapters: [
      { slug: "cnn", title: "卷积神经网络 CNN", description: "卷积、池化、感受野、ResNet 与图像分类实战。", duration: "45 分钟" },
      { slug: "rnn-lstm", title: "循环神经网络 RNN 与 LSTM", description: "序列建模、RNN 梯度消失、LSTM 与 GRU。", duration: "40 分钟" },
      { slug: "transformer", title: "Transformer 与注意力机制", description: "Self-Attention、Multi-Head、Positional Encoding。", duration: "50 分钟" },
      { slug: "transfer-learning", title: "迁移学习与预训练模型", description: "Fine-tune 实战, 用 ResNet/BERT 解决下游任务。", duration: "35 分钟" },
      { slug: "image-classification", title: "实战:图像分类", description: "用 PyTorch 训一个 ResNet,识别 CIFAR-10。", duration: "45 分钟" },
      // === v8.8 新增: 统计补充章 ===
      { slug: "training-stat-monitor", title: "训练过程的统计监控", description: "用控制图监控 loss/accuracy, 提前发现训练异常。", duration: "30 分钟" },
    ],
  },
  {
    slug: "reinforcement-learning",
    title: "强化学习入门",
    description: "从零理解强化学习:智能体、环境、奖励。涵盖 Q-Learning、DQN,以及用 PyTorch 训 CartPole。",
    level: "intermediate",
    duration: "约 5 小时",
    tags: ["强化学习", "Q-Learning", "DQN", "OpenAI Gym"],
    author: "ML 学习站",
    chapters: [
      { slug: "rl-intro", title: "强化学习是什么", description: "智能体、环境、奖励、策略与价值。", duration: "25 分钟" },
      { slug: "mdp", title: "马尔可夫决策过程", description: "MDP、状态、动作、转移概率、贝尔曼方程。", duration: "35 分钟" },
      { slug: "q-learning", title: "Q-Learning 算法", description: "表格型 Q-Learning 与 ε-贪心探索。", duration: "35 分钟" },
      { slug: "dqn", title: "深度 Q 网络 DQN", description: "用神经网络逼近 Q 函数、经验回放、目标网络。", duration: "40 分钟" },
      { slug: "cartpole", title: "实战:CartPole 训练", description: "用 PyTorch + Gym 训一个 DQN agent。", duration: "45 分钟" },
    ],
  },

  /* ============== 6 门统计学课程 (来自《基础统计学》第 14 版) ============== */
  {
    slug: "stats-foundations",
    title: "统计基础:数据与图表",
    description: "从批判性思维到数据类型、抽样、图表与描述统计,构建统计学基础。源自《基础统计学》第 1-3 章。",
    level: "beginner",
    duration: "约 5 小时",
    tags: ["统计学", "描述统计", "入门", "Python"],
    author: "ML 学习站 (基于 Triola《基础统计学》第 14 版)",
    chapters: [
      { slug: "stats-overview", title: "统计学与批判性思维", description: "什么是统计、统计的用处、统计的滥用、抽样方法。", duration: "30 分钟" },
      { slug: "data-types", title: "数据类型与抽样设计", description: "定量/分类、离散/连续、随机抽样与实验设计。", duration: "30 分钟" },
      { slug: "explore-with-charts", title: "用图表探索数据", description: "频数分布表、直方图、散点图、相关与回归可视化。", duration: "35 分钟" },
      { slug: "descriptive-stats", title: "描述统计:集中趋势与离散度", description: "均值/中位数/众数/方差/标准差/箱形图 + NumPy 实现。", duration: "40 分钟" },
    ],
  },
  {
    slug: "stats-probability",
    title: "概率论基础",
    description: "概率的基本概念、加法/乘法原理、贝叶斯定理、计数法则与离散概率分布。源自《基础统计学》第 4-5 章。",
    level: "beginner",
    duration: "约 4 小时",
    tags: ["统计学", "概率论", "贝叶斯", "二项分布"],
    author: "ML 学习站 (基于 Triola《基础统计学》第 14 版)",
    chapters: [
      { slug: "probability-basics", title: "概率的基本概念", description: "概率定义、加法/乘法原理、互补事件。", duration: "30 分钟" },
      { slug: "bayes-theorem", title: "条件概率与贝叶斯定理", description: "条件概率、贝叶斯公式、医学检验/垃圾邮件等真实例子。", duration: "35 分钟" },
      { slug: "discrete-distributions", title: "离散概率分布", description: "二项分布、泊松分布、期望与方差。", duration: "40 分钟" },
    ],
  },
  {
    slug: "stats-continuous",
    title: "连续分布与抽样",
    description: "正态分布、抽样分布、中心极限定理与正态性检验。源自《基础统计学》第 6 章。",
    level: "intermediate",
    duration: "约 3 小时",
    tags: ["统计学", "正态分布", "中心极限定理"],
    author: "ML 学习站 (基于 Triola《基础统计学》第 14 版)",
    chapters: [
      { slug: "normal-distribution", title: "正态分布", description: "正态分布性质、z 分数、68-95-99.7 法则、查表。", duration: "35 分钟" },
      { slug: "sampling-clt", title: "抽样分布与中心极限定理", description: "为什么样本均值也服从正态分布、CLT 的威力。", duration: "35 分钟" },
    ],
  },
  {
    slug: "stats-estimation",
    title: "统计推断:参数估计",
    description: "置信区间、t 分布、样本量确定。源自《基础统计学》第 7 章。",
    level: "intermediate",
    duration: "约 2 小时",
    tags: ["统计学", "置信区间", "t 分布"],
    author: "ML 学习站 (基于 Triola《基础统计学》第 14 版)",
    chapters: [
      { slug: "ci-mean-proportion", title: "置信区间:均值与比例", description: "z 区间与 t 区间, 样本量计算。", duration: "30 分钟" },
    ],
  },
  {
    slug: "stats-testing",
    title: "统计推断:假设检验",
    description: "假设检验的逻辑、p 值、单/双样本 t 检验、非参数检验。源自《基础统计学》第 8-9、13 章。",
    level: "intermediate",
    duration: "约 5 小时",
    tags: ["统计学", "假设检验", "p 值", "A/B 测试"],
    author: "ML 学习站 (基于 Triola《基础统计学》第 14 版)",
    chapters: [
      { slug: "hypothesis-testing-basics", title: "假设检验基础", description: "零假设/备择假设、显著性水平、两类错误、p 值。", duration: "35 分钟" },
      { slug: "one-sample-tests", title: "单样本检验 (z/t 检验)", description: "对总体均值/比例的检验、p 值计算。", duration: "35 分钟" },
      { slug: "two-sample-tests", title: "两样本推断", description: "独立样本 t 检验、配对样本 t 检验、A/B 测试实战。", duration: "35 分钟" },
      { slug: "nonparametric-tests", title: "非参数检验", description: "符号检验、Wilcoxon 符号秩、Kruskal-Wallis、游程检验。", duration: "30 分钟" },
    ],
  },
  {
    slug: "stats-regression",
    title: "回归与分类分析",
    description: "相关分析、线性/多元/非线性回归、卡方拟合优度与列联表、ANOVA。源自《基础统计学》第 10-12 章。",
    level: "advanced",
    duration: "约 6 小时",
    tags: ["统计学", "回归", "卡方", "ANOVA"],
    author: "ML 学习站 (基于 Triola《基础统计学》第 14 版)",
    chapters: [
      { slug: "correlation-regression", title: "相关与线性回归", description: "相关系数 r、最小二乘、预测区间、残差分析。", duration: "40 分钟" },
      { slug: "multiple-regression", title: "多元回归与虚拟变量", description: "多元线性回归、虚拟变量、逻辑回归铺垫。", duration: "40 分钟" },
      { slug: "chi-square", title: "卡方检验:拟合优度与列联表", description: "χ² 拟合优度、独立性检验、同质性检验。", duration: "35 分钟" },
      { slug: "anova", title: "方差分析 ANOVA", description: "单因素/双因素 ANOVA、Bonferroni 修正。", duration: "35 分钟" },
    ],
  },

  /* ============== v13.1 新课: NLP 入门 ============== */
  {
    slug: "nlp-basics",
    title: "自然语言处理入门",
    description: "从分词、TF-IDF、Word2Vec 到情感分析,带你走进让计算机理解人类语言的世界。",
    level: "intermediate",
    duration: "约 4 小时",
    tags: ["NLP", "TF-IDF", "Word2Vec", "情感分析"],
    author: "ML 学习站",
    chapters: [
      { slug: "text-preprocessing", title: "文本预处理与分词", description: "正则化、分词、停用词、词形还原与中文分词 jieba。", duration: "30 分钟" },
      { slug: "tf-idf", title: "词袋与 TF-IDF", description: "把文本转成向量的两种经典方法, sklearn 三行实战。", duration: "35 分钟" },
      { slug: "word2vec", title: "Word2Vec 词向量", description: "词嵌入的直觉, 跳字模型与负采样, gensim 训练自己的词向量。", duration: "40 分钟" },
      { slug: "sentiment-analysis", title: "情感分析实战", description: "用 TF-IDF + 逻辑回归给豆瓣电影评论打 1-5 星。", duration: "45 分钟" },
    ],
  },

  /* ============== v13.1 新课: 时间序列 ============== */
  {
    slug: "time-series",
    title: "时间序列分析",
    description: "从平稳性、ARIMA、Prophet 到异常检测,掌握处理时序数据的核心方法。",
    level: "intermediate",
    duration: "约 4 小时",
    tags: ["时间序列", "ARIMA", "Prophet", "异常检测"],
    author: "ML 学习站",
    chapters: [
      { slug: "ts-basics", title: "时间序列基础", description: "平稳性、自相关、ACF/PACF, 时序建模的 4 大目标。", duration: "30 分钟" },
      { slug: "arima", title: "ARIMA 模型", description: "ARIMA(p,d,q) 参数解读, auto_arima 自动选参, 季节性 SARIMA。", duration: "45 分钟" },
      { slug: "prophet", title: "Prophet 实战", description: "Meta 开源的时序工具, 趋势 + 季节性 + 节假日分解。", duration: "40 分钟" },
      { slug: "anomaly-detection", title: "时序异常检测", description: "滚动 z-score, STL 残差, Isolation Forest 实战。", duration: "35 分钟" },
    ],
  },

  /* ============== v13.1 新课: MLOps ============== */
  {
    slug: "mlops",
    title: "MLOps 入门",
    description: "把 ML 模型从 notebook 带到生产:版本管理、CI/CD、部署、监控与漂移检测。",
    level: "advanced",
    duration: "约 3 小时",
    tags: ["MLOps", "MLflow", "Docker", "监控"],
    author: "ML 学习站",
    chapters: [
      { slug: "model-versioning", title: "实验追踪与模型版本管理", description: "MLflow 三件套: Tracking + Projects + Registry, 让实验可复现。", duration: "40 分钟" },
      { slug: "model-deployment", title: "模型部署:从 pickle 到 REST API", description: "FastAPI + Docker 包装模型, nginx 反向代理, 灰度发布。", duration: "50 分钟" },
      { slug: "monitoring-drift", title: "线上监控与数据漂移", description: "性能监控、数据漂移检测、PSI / KS 检验, 报警链路。", duration: "40 分钟" },
    ],
  },


  /* ============== v15.1 新课: 推荐系统 ============== */
  {
    slug: "recsys",
    title: "推荐系统入门",
    description: "从协同过滤到矩阵分解、深度学习推荐、评估指标,理解抖音/淘宝背后的核心技术。",
    level: "intermediate",
    duration: "约 5 小时",
    tags: ["推荐系统", "协同过滤", "矩阵分解", "深度学习", "NDCG"],
    author: "ML 学习站",
    chapters: [
      { slug: "introduction", title: "推荐系统入门", description: "为什么需要推荐、典型应用、三种核心范式与工业链路。", duration: "30 分钟" },
      { slug: "matrix-factorization", title: "矩阵分解:协同过滤的数学心脏", description: "Funk SVD / BiasSVD / SVD++, 5 行 Surprise 库上手。", duration: "40 分钟" },
      { slug: "deep-learning", title: "深度学习推荐:Two-Tower / NCF / DeepFM", description: "召回双塔 / 精排 DeepFM / 阿里 DIN, 多阶段漏斗架构。", duration: "50 分钟" },
      { slug: "evaluation", title: "推荐系统评估", description: "NDCG / MAP / Recall@k + 在线 A/B 测试, 避免指标陷阱。", duration: "40 分钟" },
    ],
  },
  /* ============== v14.1 新课: LLM 入门 ============== */
  {
    slug: "llm-basics",
    title: "大语言模型入门",
    description: "从 Transformer 原理到预训练、Prompt 工程与 RAG,掌握大模型时代的核心技术。",
    level: "advanced",
    duration: "约 5 小时",
    tags: ["LLM", "Transformer", "GPT", "RAG"],
    author: "ML 学习站",
    chapters: [
      { slug: "transformer", title: "Transformer 架构原理", description: "Self-Attention、Multi-Head、位置编码,从 0 理解现代 LLM 的基石。", duration: "45 分钟" },
      { slug: "pretraining", title: "预训练:从 GPT 到开源 LLM", description: "Next-token prediction、GPT/Llama/Qwen, 万亿 token 训练简史。", duration: "40 分钟" },
      { slug: "prompt-engineering", title: "Prompt 工程实战", description: "Zero/Few-shot、CoT、ReAct、Function Call, 5 大技巧让模型输出翻倍。", duration: "35 分钟" },
      { slug: "rag", title: "RAG 检索增强生成", description: "向量检索 + LLM 答案生成, 用 LangChain 5 行搭建私有知识库问答。", duration: "45 分钟" },
    ],
  },
];
