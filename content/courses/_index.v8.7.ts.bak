/**
 * 课程元数据集中索引
 * 3 门机器学习课程,共 13 章
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
];
