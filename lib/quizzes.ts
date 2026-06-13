import type { QuizQuestion } from "@/components/quiz";

/**
 * 章末小测验题库
 * key: "courseSlug/chapterSlug"
 * value: QuizQuestion[]
 *
 * 注意: 题干/选项/explanation 内部不要再包含英文双引号 ", 用 「」 或 单引号 替代。
 */

import { generateAIQuiz } from "./ai-quiz";

export const QUIZZES: Record<string, QuizQuestion[]> = {
  "ml-basics/what-is-ml": [
    {
      question: "机器学习与传统编程最本质的区别是什么?",
      options: [
        "机器学习用 Python,传统编程用 C++",
        "机器学习从数据中自动学规律,传统编程靠人写规则",
        "机器学习更快,传统编程更慢",
        "机器学习更准,传统编程更不准",
      ],
      correct: 1,
      explanation: "传统编程是「输入 + 规则 → 输出」,机器学习是「输入 + 输出 → 规则」,让计算机自己从数据里学规律。",
    },
    {
      question: "下列哪一项不是机器学习的主流任务?",
      options: ["分类(如垃圾邮件识别)", "回归(如房价预测)", "聚类(如用户分群)", "数据库查询(如 SELECT)"],
      correct: 3,
      explanation: "数据库查询是确定性操作,不涉及「学规律」。机器学习的四大任务是分类、回归、聚类、生成。",
    },
    {
      question: "深度学习在 2012 年开始爆发,主要驱动因素不包括下列哪一项?",
      options: ["海量数据", "GPU 算力提升", "算法突破(如 AlexNet)", "CPU 主频持续翻倍"],
      correct: 3,
      explanation: "CPU 主频受限于物理瓶颈,过去十年并没有持续翻倍。深度学习的爆发靠的是数据 + GPU + 算法三大支柱。",
    },
  ],
  "ml-basics/ml-types": [
    {
      question: "把「识别手写数字」归类为哪种学习?",
      options: ["监督学习", "无监督学习", "强化学习", "半监督学习"],
      correct: 0,
      explanation: "有大量「图片 + 正确答案」的数据,这是典型的监督学习(分类)。",
    },
    {
      question: "下列哪个问题最适合用强化学习?",
      options: [
        "预测明天股价",
        "把客户分成几类",
        "训练机器人学会走路(撞墙给负奖励,前进给正奖励)",
        "识别图片里有没有猫",
      ],
      correct: 2,
      explanation: "强化学习适合「和环境互动 + 奖励信号」的场景。走路就是典型例子。",
    },
    {
      question: "准确率(Accuracy)在什么情况下会骗人?",
      options: [
        "数据量太大时",
        "类别严重不平衡时(如 95% 正常邮件 + 5% 垃圾邮件)",
        "使用神经网络时",
        "数据来自数据库时",
      ],
      correct: 1,
      explanation: "如果 95% 都是正常邮件,一个「全猜正常」的模型准确率 95%,但完全没用。这种情况要改用 Precision/Recall/F1。",
    },
  ],
  "ml-basics/first-model": [
    {
      question: "线性回归中,MSE 损失函数的公式是?",
      options: [
        "(1/n) * sum(|y_hat - y|)",
        "(1/n) * sum((y_hat - y)^2)",
        "sum(y_hat - y)",
        "max(|y_hat - y|)",
      ],
      correct: 1,
      explanation: "MSE = Mean Squared Error = 平均平方误差,这是最常用的回归损失。",
    },
    {
      question: "为什么最小二乘法用「平方」而不是「绝对值」?",
      options: [
        "平方数学上更复杂,显得有水平",
        "平方处处可导、便于优化、对大误差惩罚更重",
        "绝对值没法算",
        "sklearn 默认这么写",
      ],
      correct: 1,
      explanation: "平方有三个优势:数学性质好(处处可导)、对大误差更敏感、便于梯度下降优化。",
    },
  ],
  "ml-basics/model-eval": [
    {
      question: "为什么要把数据分成训练集和测试集?",
      options: [
        "减少计算量",
        "在没见过的数据上评估模型,避免高估准确率",
        "符合行业标准",
        "sklearn 要求",
      ],
      correct: 1,
      explanation: "在训练集上评估会严重高估模型泛化能力。测试集是「期末考试」,必须从未见过。",
    },
    {
      question: "K 折交叉验证相比单次 train/test 划分,优势是?",
      options: [
        "训练更快",
        "评估结果更稳定,减少因划分偶然性带来的波动",
        "代码更简单",
        "需要更多数据",
      ],
      correct: 1,
      explanation: "单次划分受随机性影响大,5 折 CV 用 5 次平均,结果更稳健。",
    },
    {
      question: "癌症筛查中,漏诊(把癌症判成健康)通常比误诊(把健康判成癌症)更不能接受,这对应:",
      options: [
        "优先提高 Precision(查准率)",
        "优先提高 Recall(查全率)",
        "优先提高 Accuracy(准确率)",
        "优先提高 F1 分数",
      ],
      correct: 1,
      explanation: "漏诊 = FN 增加 → Recall 下降。所以「不能漏诊」对应「必须高 Recall」。",
    },
  ],
  "ml-basics/overfitting": [
    {
      question: "训练误差 0.01,测试误差 0.45,这是典型的?",
      options: ["欠拟合", "过拟合", "完美拟合", "正常情况"],
      correct: 1,
      explanation: "训练误差极低但测试误差很高,差距大 → 过拟合。",
    },
    {
      question: "下列哪种方法不能缓解过拟合?",
      options: ["增加训练数据", "降低模型复杂度", "正则化(L1/L2)", "增加模型复杂度"],
      correct: 3,
      explanation: "增加模型复杂度会加剧过拟合。其他三个是常规缓解手段。",
    },
    {
      question: "L2 正则化为什么能防止过拟合?",
      options: [
        "让模型更复杂",
        "在损失函数中加权重惩罚,迫使权重变小,从而降低模型复杂度",
        "增加数据",
        "加快训练",
      ],
      correct: 1,
      explanation: "L2 = (1/2) * sum(w^2) 加到损失上,优化时会倾向于让 w 更小,模型更平滑 → 抗过拟合。",
    },
  ],

  "supervised-learning/logistic-regression": [
    {
      question: "逻辑回归是用于什么任务?",
      options: ["回归(预测连续值)", "分类(预测离散类别)", "聚类", "降维"],
      correct: 1,
      explanation: "虽然名字带「回归」,但逻辑回归是分类算法——把线性输出喂给 sigmoid,得到 0~1 概率。",
    },
    {
      question: "逻辑回归为什么用交叉熵而不是 MSE?",
      options: [
        "MSE 算得慢",
        "sigmoid + MSE 会导致损失函数非凸,优化困难;交叉熵是凸的",
        "sklearn 这么实现的",
        "历史原因",
      ],
      correct: 1,
      explanation: "sigmoid + MSE 损失函数非凸,梯度下降可能卡在局部最优。交叉熵+ sigmoid 损失是凸的,有全局最优。",
    },
  ],
  "supervised-learning/decision-trees": [
    {
      question: "决策树用哪个指标选择在哪个特征上切分?",
      options: ["随机选", "信息增益(Information Gain)或基尼系数(Gini)", "特征编号", "字符长度"],
      correct: 1,
      explanation: "ID3 用信息增益,C4.5 用信息增益率,CART 用基尼系数。sklearn 默认 Gini(计算更快)。",
    },
    {
      question: "决策树最常用的防止过拟合方法是?",
      options: [
        "增加树的深度",
        "剪枝(限制 max_depth / min_samples_leaf)",
        "用更多特征",
        "增加数据噪声",
      ],
      correct: 1,
      explanation: "限制 max_depth、min_samples_split、min_samples_leaf 是最常用的「预剪枝」手段。",
    },
  ],
  "supervised-learning/svm": [
    {
      question: "SVM 找的超平面有什么特点?",
      options: [
        "离最近点距离最大(最大间隔)",
        "离原点最近",
        "经过所有点",
        "垂直于 y 轴",
      ],
      correct: 0,
      explanation: "SVM 找的是最大间隔分界,几何上最宽的马路把两类分开。",
    },
    {
      question: "SVM 的核函数(Kernel)是用来做什么的?",
      options: [
        "加速训练",
        "把低维不可分的数据映射到高维,让数据线性可分",
        "减少内存",
        "防止过拟合",
      ],
      correct: 1,
      explanation: "核函数 = 把数据假装映射到高维,实际只算低维的内积,让 SVM 能处理非线性问题。",
    },
  ],
  "supervised-learning/ensemble": [
    {
      question: "Bagging 和 Boosting 的核心区别是?",
      options: [
        "Bagging 用决策树,Boosting 用神经网络",
        "Bagging 并行训练、降方差;Boosting 串行训练、降偏差",
        "Bagging 更快",
        "Bagging 更准",
      ],
      correct: 1,
      explanation: "Bagging(随机森林)是「并行投票」,降低方差;Boosting(XGBoost)是「串行纠错」,降低偏差。",
    },
    {
      question: "XGBoost 为什么是工业界表格数据的事实标准?",
      options: [
        "名字好听",
        "支持二阶导数、缺失值处理、正则化、并行化等",
        "免费",
        "写起来简单",
      ],
      correct: 1,
      explanation: "XGBoost 在传统 GBDT 基础上做了大量工程优化:二阶导、剪枝、缺失值、并行、稀疏特征处理,综合性能极强。",
    },
  ],

  "neural-networks/perceptron": [
    {
      question: "为什么单层感知机学不会异或(XOR)?",
      options: [
        "数据太少",
        "异或问题线性不可分,单层感知机只能学线性决策边界",
        "sklearn 不支持",
        "激活函数不对",
      ],
      correct: 1,
      explanation: "XOR 在 2D 平面上一条直线分不开,单层感知机没有隐藏层,只能学线性。这是 1969 年导致 AI 寒冬的著名发现。",
    },
    {
      question: "激活函数为什么必须是非线性的?",
      options: [
        "看起来酷",
        "线性激活函数的多层堆叠等价于单层,无法解决非线性问题",
        "性能好",
        "sklearn 要求",
      ],
      correct: 1,
      explanation: "线性变换的组合还是线性的,多层 = 单层。要学到复杂关系,必须用非线性激活(ReLU/Sigmoid/Tanh)。",
    },
  ],
  "neural-networks/backpropagation": [
    {
      question: "反向传播本质上是什么?",
      options: [
        "把数据倒着传",
        "链式法则的高效应用",
        "一个神奇的优化器",
        "PyTorch 自带的",
      ],
      correct: 1,
      explanation: "反向传播 = 链式法则的工程化实现。一次正向 + 一次反向 = 算所有参数的梯度,时间复杂度 O(N)。",
    },
    {
      question: "为什么深度网络会梯度消失?",
      options: [
        "数据不够",
        "反向传播要连乘很多局部导数,如果每个 < 1,指数级衰减到 0",
        "网络太大",
        "Loss 函数不对",
      ],
      correct: 1,
      explanation: "每层局部导数 < 1 时,10 层后梯度 ≈ 0.1^10 = 10^-10,前层参数根本更新不了。ReLU + BN + 残差连接是常见解法。",
    },
  ],
  "neural-networks/activation-loss": [
    {
      question: "为什么隐藏层默认用 ReLU 而不是 Sigmoid?",
      options: [
        "Sigmoid 太丑",
        "Sigmoid 在饱和区导数几乎为 0,深层网络会梯度消失;ReLU 导数稳定为 1",
        "ReLU 算得快",
        "历史原因",
      ],
      correct: 1,
      explanation: "Sigmoid 在 z 很大或很小时导数几乎为 0,深层网络前几层几乎不更新。ReLU 解决了这个问题。",
    },
    {
      question: "为什么 nn.CrossEntropyLoss 内部已经包含 Softmax,不要再加?",
      options: [
        "会算慢",
        "softmax 会被算两次,反向传播梯度会出问题",
        "会报错",
        "PyTorch 强制要求",
      ],
      correct: 1,
      explanation: "手动加 Softmax + CrossEntropyLoss 会导致 Softmax 被算两次,梯度会异常。这是初学者最常犯的错误。",
    },
  ],
  "neural-networks/training-tips": [
    {
      question: "以下哪个超参数最重要,通常先调?",
      options: ["batch size", "学习率(learning rate)", "模型层数", "optimizer 类型"],
      correct: 1,
      explanation: "学习率是最关键的单一超参。调好了别的都还好,调不好别的都白搭。",
    },
    {
      question: "BatchNorm 的作用是?",
      options: [
        "加快数据加载",
        "归一化每层输入,让分布稳定,允许更大学习率,加速收敛",
        "防止过拟合",
        "减少参数",
      ],
      correct: 1,
      explanation: "BN 通过归一化让每层输入分布稳定,是现代深度网络的标配之一。",
    },
  ],
};

export function getQuiz(courseSlug: string, chapterSlug: string): QuizQuestion[] {
  return QUIZZES[`${courseSlug}/${chapterSlug}`] ?? [];
}

/** 静态题库为空时, 调 LLM 生成 (AI 兜底)
 * 章节页可直接调, 失败回退到空数组 (Quiz 组件不渲染)
 */
export async function getOrGenerateQuiz(courseSlug: string, chapterSlug: string, count = 5): Promise<QuizQuestion[]> {
  const staticQs = QUIZZES[`${courseSlug}/${chapterSlug}`];
  if (staticQs && staticQs.length > 0) return staticQs;
  try {
    // 读 mdx 内容
    const fs = await import("fs/promises");
    const path = await import("path");
    const file = path.join(process.cwd(), "content", "courses", courseSlug, `${chapterSlug}.mdx`);
    let content = await fs.readFile(file, "utf8");
    content = content
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/^import .*$/gm, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/```[\s\S]*?```/g, "")
      .trim();
    const r = await generateAIQuiz(courseSlug, chapterSlug, content, { count });
    return r.questions;
  } catch (e) {
    return [];
  }
}
