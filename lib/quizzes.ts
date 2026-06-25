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

  
  /* ============== v14.1 LLM 入门 ============== */
  "llm-basics/transformer": [
    {
      question: "Transformer 中 Self-Attention 的核心思想是?",
      options: ["用 RNN 处理序列", "让任意两位置直接交互, 按相关性加权求和", "用卷积核扫描序列", "逐位置独立处理"],
      correct: 1,
      explanation: "Self-Attention 让序列中每个位置跟所有其他位置直接计算相关性, 然后按权重把它们的值加起来, 解决 RNN 长距离依赖和并行难的问题。",
    },
    {
      question: "为什么 Transformer 需要位置编码?",
      options: ["为了压缩参数", "Self-Attention 是排列不变的, 丢失了顺序信息", "为了加速训练", "为了多语言支持"],
      correct: 1,
      explanation: "Self-Attention 只看内容相关性, 不看位置。位置编码 (sin/cos 或 RoPE) 把位置信息塞回输入, 解决排列不变性问题。",
    },
  ],
  "llm-basics/pretraining": [
    {
      question: "GPT 系列大模型的核心训练目标是?",
      options: ["图像分类", "下一个 token 预测", "情感分析", "机器翻译"],
      correct: 1,
      explanation: "GPT 用 Next-token prediction (猜下一个 token) 训练, 这个简单的目标涌现出推理、写代码、对话等所有智能行为。",
    },
    {
      question: "为什么 7B 模型是消费级 GPU 性价比最高的档位?",
      options: ["7B 是黄金数字", "fp16 下 7B 只要 14GB 显存, 单张 RTX 3090/4090 就能跑, 质量够用", "不能选别的", "7B 比 13B 更快"],
      correct: 1,
      explanation: "7B 模型 fp16 占 14GB 显存, 单张消费级 GPU 就能跑, 推理 + LoRA 微调都可行。70B 需要多卡 A100, 成本 10x 但质量提升有限。",
    },
  ],
  "llm-basics/prompt-engineering": [
    {
      question: "CoT (Chain-of-Thought) 的核心是?",
      options: ["用更多 token", "让模型一步步推理, 而不是直接给答案", "调高 temperature", "换更大的模型"],
      correct: 1,
      explanation: "CoT = Chain of Thought, 加 让我们一步步思考 这类 prompt, 强制模型写出推理过程, 数学题准确率能提升 30-40%。",
    },
    {
      question: "Function Calling 解决什么问题?",
      options: ["加快推理", "让 LLM 输出结构化 JSON 来调用外部 API/工具", "降低显存", "改进翻译"],
      correct: 1,
      explanation: "Function Calling 让 LLM 输出结构化 JSON 描述要调用的函数 + 参数, 程序决定调什么 API、怎么用结果。这是 ReAct 模式的工程化。",
    },
  ],
  "llm-basics/rag": [
    {
      question: "RAG 解决 LLM 哪两个核心痛点?",
      options: ["训练太慢", "知识陈旧 + 幻觉编造", "GPU 不够", "中文不好"],
      correct: 1,
      explanation: "RAG 把 LLM 从闭卷考试变成开卷考试: 先检索相关文档, 再让模型基于文档回答, 解决知识陈旧 (训练数据截止) 和幻觉 (编造) 两个核心问题。",
    },
    {
      question: "为什么 RAG 90% 场景先于微调?",
      options: ["微调不能做", "RAG 更新成本低 (分钟级)、可解释、有据可查、幻觉低", "RAG 质量更好", "微调太贵"],
      correct: 1,
      explanation: "RAG 重新索引几分钟就生效, 微调要几小时-几天。RAG 答案可看到引用来源, 微调是黑盒。90% 企业问答场景 RAG 够用, 不够才微调。",
    },
  ],
/* ============== v15.1 推荐系统 ============== */
  "recsys/introduction": [
    {
      question: "推荐系统要解决的核心矛盾是?",
      options: ["GPU 不够", "信息供给 >> 用户消费能力, 需要主动筛选 + 个性化排序", "代码太多", "用户太懒"],
      correct: 1,
      explanation: "互联网从人找信息变成信息找人, 信息爆炸必须靠算法主动筛选 + 个性化排序, 否则用户淹没在数据里。",
    },
    {
      question: "以下哪个不是推荐系统的典型应用场景?",
      options: ["抖音视频流", "淘宝商品", "Spotify 歌单", "Linux 内核编译"],
      correct: 3,
      explanation: "推荐系统主要用在内容/商品/音乐/新闻/本地生活/招聘等 C 端场景, 编译器输出是确定性结果不需要推荐。",
    },
    {
      question: "工业界推荐完整链路的'快-准'权衡中, 召回阶段用什么模型?",
      options: ["DeepFM", "Two-Tower / 协同过滤", "DIN", "RNN"],
      correct: 1,
      explanation: "召回是亿级物品粗筛到 1k+, 速度优先, 用双塔 (可离线预计算 embedding + 向量检索) 或协同过滤; 精排才用 DeepFM/DIN。",
    },
  ],
  "recsys/matrix-factorization": [
    {
      question: "Funk SVD 的核心思想是?",
      options: ["用真正 SVD 分解稀疏矩阵", "直接学两个小矩阵 P 和 Q, 最小化预测误差平方和", "用 NMF 替代", "用神经网络"],
      correct: 1,
      explanation: "Funk SVD (2006) 不用真 SVD, 直接学 m×k 和 k×n 的小矩阵 P 和 Q, 最小化预测误差, 用 SGD/ALS 求解, 是 Netflix Prize 冠军方案基石。",
    },
    {
      question: "BiasSVD 比纯 SVD 提升主要来自?",
      options: ["用了更多参数", "加了全局平均 + 用户偏置 + 物品偏置, 反映打分习惯差异", "用 GPU 训练", "加了非线性"],
      correct: 1,
      explanation: "实际评分受三类偏置影响: 全局平均 μ、用户偏置 bu (严/宽) 、物品偏置 bi (普遍高分), 加偏置后比纯内积提升 5-10%。",
    },
  ],
  "recsys/deep-learning": [
    {
      question: "Two-Tower (双塔) 模型最大的工业优势是?",
      options: ["精度最高", "物品塔可离线预计算全部 embedding, 在线只算用户侧 + 向量检索, 毫秒级响应", "训练最快", "参数最少"],
      correct: 1,
      explanation: "双塔的核心工业价值是物品塔离线预计算所有 embedding 存向量库 (Faiss/Milvus), 在线只算用户 embedding + 向量检索, 真正做到亿级物品毫秒级召回。",
    },
    {
      question: "DIN (Deep Interest Network) 用 Attention 解决的核心问题是?",
      options: ["训练太慢", "用户兴趣是多样的, 不同候选物品激活的历史行为不同, 需用候选物品'查询'用户历史", "维度太高", "数据稀疏"],
      correct: 1,
      explanation: "DIN 用候选物品作 Query 去 Attention 用户历史行为, 给相关历史更高权重, 解决'买了篮球又推更多篮球'问题, 实际激活'运动装备'这个更广兴趣。",
    },
    {
      question: "现代推荐系统的'召回-粗排-精排-重排'漏斗, 哪一阶段最'准'?",
      options: ["召回", "粗排", "精排", "重排"],
      correct: 2,
      explanation: "精排用最复杂的模型 (DeepFM/DIN), 候选少 (50), 可以花更多算力追求精度; 召回追求快, 精排追求准, 重排加业务规则。",
    },
  ],
  "recsys/evaluation": [
    {
      question: "为什么 NDCG@K 比 Precision@K 更受推荐系统青睐?",
      options: ["计算快", "考虑位置权重 + 多档相关度, 排得越靠前的相关物品贡献越大", "只看 Top1", "只看准确率"],
      correct: 1,
      explanation: "NDCG 给位置靠前的相关物品更高权重 (分母 log2(k+1)), 且支持多档相关度 (评分 5 > 3), 比只看命中数的 Precision@K 更贴近用户真实体验。",
    },
    {
      question: "推荐 A/B 测试关键陷阱中, '新奇效应'是指?",
      options: ["用户因为'新'而点, 1 周后回归", "流量分桶不均", "作弊", "样本太少"],
      correct: 0,
      explanation: "新奇效应指用户因推荐结果'新鲜'而短期点击率上升, 1-2 周后回归正常。所以 A/B 至少跑 7 天才能下结论, 否则会高估新模型收益。",
    },
  ],
/* ============== v15.2 CV 入门 ============== */
  "cv-basics/cnn-fundamentals": [
    {
      question: "CNN 比全连接网络在图像任务上最大的优势是?",
      options: ["训练更快", "局部连接 + 权值共享, 保留空间结构且大幅减少参数", "用更少数据", "支持彩色图"],
      correct: 1,
      explanation: "CNN 通过局部连接 (感受野) + 权值共享 (同一卷积核扫遍全图) + 平移不变性, 既保留图像空间结构, 又比全连接大幅减少参数。",
    },
    {
      question: "ResNet 的核心创新 '残差学习' 解决了什么?",
      options: ["过拟合", "网络越深越难训练, 梯度消失", "数据不够", "推理慢"],
      correct: 1,
      explanation: "ResNet 学 F(x)+x 而非 H(x), 让网络'什么都不做'很容易 (F(x)=0), 反向传播时梯度可走 shortcut 直达浅层, 缓解深度网络梯度消失。",
    },
    {
      question: "ImageNet Top-5 错误率首次低于人类 5.1% 是哪年哪个模型?",
      options: ["AlexNet 2012", "VGG 2014", "GoogLeNet 2014", "ResNet 2015"],
      correct: 3,
      explanation: "ResNet-152 (2015) 在 ImageNet 上 Top-5 错误率 3.57%, 首次低于人类水平 5.1%, 标志着深度学习超越人类。",
    },
  ],
  "cv-basics/transfer-learning": [
    {
      question: "迁移学习中, '特征提取' 与 '微调' 的关键区别是?",
      options: ["用不用预训练权重", "特征提取冻结 backbone 只训分类头, 微调全模型解冻并用更小学习率", "数据量要求不同", "只能用 ResNet"],
      correct: 1,
      explanation: "特征提取冻结 backbone 参数只训新分类头 (适合数据极少), 微调解冻全模型但 backbone 用更小学习率 1e-5 (适合数据中等)。",
    },
    {
      question: "微调 backbone 时学习率太大, 最可能发生什么?",
      options: ["训练变快", "backbone 预训练权重被破坏, 效果反而比冻结差", "显存爆", "不支持"],
      correct: 1,
      explanation: "学习率太大会破坏预训练权重 (浅层通用特征被覆盖), 效果反而比冻结 backbone + 只训 head 差。这是微调最常见的坑。",
    },
  ],
  "cv-basics/object-detection": [
    {
      question: "Faster R-CNN 相比 Fast R-CNN 的核心改进是?",
      options: ["用了更大的 backbone", "RPN (Region Proposal Network) 替代 Selective Search, 端到端训练", "支持视频", "用 Transformer"],
      correct: 1,
      explanation: "Faster R-CNN (2015) 用 RPN 在 feature map 上滑窗提议候选框, 替代耗时的 Selective Search, 真正端到端训练, 速度从 0.3s 降到 0.2s/图。",
    },
    {
      question: "YOLO 系列最核心的创新是?",
      options: ["用 Transformer", "单次 CNN 前向直接出所有检测结果, 把检测当回归问题", "支持 3D", "更高 mAP"],
      correct: 1,
      explanation: "YOLO (2016) 把图分 S×S 网格, 每个格子直接预测 B 个边界框 + 类别, 单次 CNN 前向出所有结果, 速度 45 FPS 实时检测。",
    },
    {
      question: "目标检测中的 NMS (Non-Max Suppression) 作用是?",
      options: ["提升 mAP", "对重叠框去重, 保留分数最高的, 减少冗余检测", "加速训练", "平衡类别"],
      correct: 1,
      explanation: "NMS 按置信度排序, 抑制 IoU > 阈值 (e.g. 0.5) 的低分框, 解决同一物体被多次检测的冗余问题。",
    },
  ],
  "cv-basics/image-segmentation": [
    {
      question: "语义分割、实例分割、全景分割的核心区别是?",
      options: ["用的网络不同", "语义给每像素类别, 实例给每目标 mask, 全景 = 语义 + 实例", "数据集不同", "评估指标不同"],
      correct: 1,
      explanation: "语义分割: 每像素一个类别不区分个体。实例分割: 每个目标实例一个 mask + 类别。全景: 二者合并, 背景给语义, 前景给实例。",
    },
    {
      question: "U-Net 的核心创新是?",
      options: ["用了 Transformer", "对称编码器-解码器 + 跳跃连接, 把浅层细节拼接到解码器", "加了注意力", "用 GAN 训练"],
      correct: 1,
      explanation: "U-Net (2015) 对称的 Encoder-Decoder 结构 + 跳跃连接 (skip connection), 把编码器的高分辨率特征直接拼接到解码器, 兼顾语义和细节, 至今仍是医学影像分割 baseline。",
    },
    {
      question: "SAM (Segment Anything, Meta 2023) 的核心创新是?",
      options: ["更快", "基础模型 + 提示式 (点/框/mask) 零样本分割任意物体, 无需训练", "更高 mIoU", "3D 支持"],
      correct: 1,
      explanation: "SAM 是基础模型 + 提示式分割, 用户给点/框/mask 提示, 模型实时输出高质量分割, 零样本适用任意物体, 是 CV 基础模型的里程碑。",
    },
  ],
/* ============== v15.3 GNN 入门 ============== */
  "gnn-basics/graph-basics": [
    {
      question: "图的邻接矩阵表示中, 节点数 n 时矩阵是?",
      options: ["1×n", "n×n", "n×1", "稀疏 n×n"],
      correct: 1,
      explanation: "邻接矩阵是 n×n 方阵, A[i][j]=1 表示 i 和 j 之间有边。大图稀疏时实际用稀疏矩阵存, 节省空间。",
    },
    {
      question: "BFS 和 DFS 的核心区别是?",
      options: ["BFS 用栈, DFS 用队列", "BFS 求最短路径, DFS 用拓扑排序; BFS 用队列一层层扩散, DFS 一条路走到底", "都一样", "BFS 只能有向图"],
      correct: 1,
      explanation: "BFS 用队列一层层往外扩散, 适合求无权图最短路径。DFS 用栈/递归一条路走到底再回溯, 适合拓扑排序/环检测。",
    },
    {
      question: "PageRank 的核心思想是?",
      options: ["页面越大越重要", "被重要节点链接的节点更重要, 迭代到收敛", "随机点击", "按时间排序"],
      correct: 1,
      explanation: "PageRank: 节点重要性 = 被重要节点链接, 公式 PR(v) = (1-d)/N + d × Σ PR(u)/L(u), 迭代计算直到收敛, Google 用来排网页。",
    },
  ],
  "gnn-basics/gnn-fundamentals": [
    {
      question: "GNN 中 Message Passing 的三步是?",
      options: ["编码 / 解码 / 输出", "聚合 (Aggregate) / 更新 (Update) / 循环 (Iterate)", "前向 / 反向 / 优化", "采样 / 训练 / 测试"],
      correct: 1,
      explanation: "所有 GNN 都可以抽象成三步: 1) 聚合邻居消息 2) 更新自身表示 3) 循环 K 次让信息传到 K-hop 外。",
    },
    {
      question: "GCN / GraphSAGE / GAT 三者核心区别是?",
      options: ["层数不同", "GCN 均值聚合 (等权邻居), GraphSAGE 邻居采样支持大图, GAT 用 Attention 学邻居权重", "用不同损失", "用不同激活"],
      correct: 1,
      explanation: "GCN 用均值聚合所有邻居 (简单但等权); GraphSAGE 采样固定数量邻居 (大图可扩展); GAT 用 Attention 自动学邻居重要性 (解释性好但慢)。",
    },
    {
      question: "GNN 深层后'过平滑'现象是指?",
      options: ["训练变慢", "所有节点表示趋于相同, 节点不可区分", "梯度爆炸", "欠拟合"],
      correct: 1,
      explanation: "GNN 深层反复平均后, 所有节点表示趋于相同 (过平滑), 节点失去区分度。解法: 残差连接 / DropEdge / PairNorm / APPNP。",
    },
  ],
  "gnn-basics/gnn-applications": [
    {
      question: "链接预测的核心目标是?",
      options: ["给节点分类", "预测两个节点之间是否会有边", "给整图分类", "生成新节点"],
      correct: 1,
      explanation: "链接预测 (Link Prediction) 预测两个节点之间是否会有边, 是推荐系统核心 (好友推荐 / 物品推荐 / KG 补全)。",
    },
    {
      question: "图分类任务中 Readout 操作用来?",
      options: ["节点分类", "把节点 embedding 聚合成一个图 embedding", "生成新图", "边预测"],
      correct: 1,
      explanation: "Readout 把图中所有节点 embedding 聚合成一个图级向量, 用于整图分类。常用 global_mean_pool / global_max_pool / global_add_pool / Set2Set。",
    },
    {
      question: "TransE 的核心思想是?",
      options: ["拼接头尾", "h + r ≈ t, 关系 r 是头尾之间的平移向量", "注意力", "全连接"],
      correct: 1,
      explanation: "TransE (2013) 把关系 r 当作头向量 h 到尾向量 t 的平移: h + r ≈ t, 评分函数 f = -||h + r - t||。几何直观, 适合知识图谱补全。",
    },
  ],
  "gnn-basics/graph-transformers": [
    {
      question: "Graph Transformer 相比传统 GNN 的核心优势是?",
      options: ["更快", "全局 Attention 让任意两节点直接相连, 解决长距离依赖与过平滑", "参数更少", "不用训练"],
      correct: 1,
      explanation: "Graph Transformer 用全局 Attention, 任意两节点直接相连, 不受距离限制, 解决 GNN 的过平滑 + 过压缩 + 长距离依赖三大局限。",
    },
    {
      question: "Graphormer 的核心创新是?",
      options: ["用 ReLU", "用图结构当 Attention 偏置 (空间编码 + 边编码 + 度编码)", "并行训练", "更大模型"],
      correct: 1,
      explanation: "Graphormer (Microsoft 2021) 把图结构编码成 Attention 偏置矩阵 B: 节点度编码 + 最短路径空间编码 + 边特征编码, OGB-LSC 分子预测冠军。",
    },
  ],
/* ============== v13.1 NLP 入门 ============== */
  "nlp-basics/text-preprocessing": [
    {
      question: "中文分词最常用的开源工具是?",
      options: ["NLTK", "spaCy", "jieba", "Stanford CoreNLP"],
      correct: 2,
      explanation: "jieba 是中文 NLP 最常用的分词库,基于前缀词典 + 动态规划,简单易用,适合大多数场景。",
    },
    {
      question: "为什么情感分析中'不推荐'不能拆成'不'和'推荐'?",
      options: ["太长了", "否定词'不'被去停用词过滤掉,语义反转", "速度太慢", "需要 GPU 加速"],
      correct: 1,
      explanation: "停用词表通常包含'不'、'没'等否定词,但情感分析必须保留它们,否则'不好'会变成'好',语义完全反转。",
    },
  ],
  "nlp-basics/tf-idf": [
    {
      question: "TF-IDF 中的 IDF 是什么的缩写?",
      options: ["Internal Document Format", "Inverse Document Frequency", "Index Data File", "Incremental Document Filter"],
      correct: 1,
      explanation: "IDF = Inverse Document Frequency (逆文档频率),衡量一个词在多少文档中出现,出现越少 IDF 越高,代表该词越有区分力。",
    },
    {
      question: "词袋 (Bag-of-Words) 模型最大的局限是?",
      options: ["计算太慢", "完全丢掉语序信息", "内存占用大", "不支持中文"],
      correct: 1,
      explanation: "词袋模型只看每个词出现几次,完全不关心顺序。所以'我打你'和'你打我'在词袋模型里完全一样。要保留语序需要用 n-gram 或深度学习。",
    },
  ],
  "nlp-basics/word2vec": [
    {
      question: "Word2Vec 中'king - man + woman ≈ queen'这种类比能力是怎么来的?",
      options: ["人工标注", "训练数据里有这个事实", "向量空间里几何关系自然涌现", "随机初始化"],
      correct: 2,
      explanation: "Word2Vec 把词映射到向量空间,语义关系以几何关系(向量加减)自然涌现。这是 word embedding 最有魅力的特性,不需要任何人工标注。",
    },
    {
      question: "Skip-gram 和 CBOW 的区别是?",
      options: ["Skip-gram 用 GPU, CBOW 用 CPU", "Skip-gram 用中心词预测上下文, CBOW 用上下文预测中心词", "Skip-gram 是监督学习, CBOW 是无监督", "没有区别, 只是名字不同"],
      correct: 1,
      explanation: "Skip-gram 用中心词预测周围上下文;CBOW 用周围上下文预测中心词。Skip-gram 在小数据集上表现更好,CBOW 训练更快。",
    },
  ],
  "nlp-basics/sentiment-analysis": [
    {
      question: "TF-IDF + 逻辑回归在 IMDb 影评情感分析上通常能达到多少准确率?",
      options: ["50-60%", "65-75%", "85-90%", "99%+"],
      correct: 2,
      explanation: "TF-IDF (ngram 1-2) + LogisticRegression 在 IMDb 数据集上通常 85-90% 准确率。要 95%+ 需要 BERT 等深度学习模型。",
    },
    {
      question: "处理类别不平衡的简单方法是?",
      options: ["加大 batch size", "class_weight='balanced'", "换优化器", "增加训练轮数"],
      correct: 1,
      explanation: "sklearn 的 LogisticRegression 支持 class_weight='balanced',自动根据类别频率反比分配权重,让模型关注少数类。",
    },
  ],

  /* ============== v13.1 时间序列 ============== */
  "time-series/ts-basics": [
    {
      question: "判断时间序列是否平稳的常用检验是?",
      options: ["t 检验", "ADF 检验 (Augmented Dickey-Fuller)", "F 检验", "卡方检验"],
      correct: 1,
      explanation: "ADF 检验的原假设是'序列非平稳',p 值 < 0.05 拒绝原假设 → 序列平稳。KPSS 检验方向相反,原假设是平稳。",
    },
    {
      question: "时间序列 4 大分析目标是?",
      options: ["回归、分类、聚类、生成", "描述、预测、异常检测、控制", "训练、验证、测试、部署", "监督、无监督、半监督、强化"],
      correct: 1,
      explanation: "时序分析的 4 大目标是: 描述 (画图看趋势)、预测 (未来值)、异常检测 (找出反常点)、控制 (判断过程是否在控)。",
    },
  ],
  "time-series/arima": [
    {
      question: "ARIMA(p, d, q) 中的 d 代表什么?",
      options: ["滞后阶数", "差分次数", "季节周期", "残差项数"],
      correct: 1,
      explanation: "ARIMA 的 3 个参数: p = AR 阶数 (滞后), d = 差分次数 (让数据平稳), q = MA 阶数 (残差滞后)。",
    },
    {
      question: "用 pmdarima 的 auto_arima 有什么好处?",
      options: ["跑得更快", "自动遍历 (p,d,q) 组合选 AIC 最小的", "支持中文", "能预测未来 100 年"],
      correct: 1,
      explanation: "auto_arima 自动遍历 (p, d, q) 组合,选 AIC 最小的,省去手动调参。AIC 衡量'拟合好 + 参数少'的平衡,越小越好。",
    },
  ],
  "time-series/prophet": [
    {
      question: "Prophet 公式 y(t) = ?",
      options: ["y = wx + b", "y = trend + seasonality + holidays + error", "y = AR + MA + noise", "y = sigmoid(wx + b)"],
      correct: 1,
      explanation: "Prophet 把时序分解为: 长期趋势 (trend) + 季节性 (seasonality) + 节假日效应 (holidays) + 残差 (error)。简单可解释。",
    },
    {
      question: "Prophet 处理中国春节影响最常用的方法是?",
      options: ["改用 ARIMA", "自定义 holidays DataFrame, 标记春节日期", "删除春节前后数据", "用月度数据替代日数据"],
      correct: 1,
      explanation: "Prophet 接受自定义 holidays DataFrame,标记春节日期并设 lower_window/upper_window 让前后几天都受春节影响,通常能显著提升 MAPE。",
    },
  ],
  "time-series/anomaly-detection": [
    {
      question: "PSI (Population Stability Index) > 0.25 通常表示?",
      options: ["无漂移", "轻微漂移, 持续关注", "严重漂移, 需要重训模型", "系统故障"],
      correct: 2,
      explanation: "PSI < 0.1 无漂移, 0.1-0.25 轻微漂移, > 0.25 严重漂移。这是金融风控模型最常用的阈值,源于人口稳定性分析。",
    },
    {
      question: "时序异常检测的 STL 分解方法的核心是?",
      options: ["直接用原始数据", "拆成 trend + seasonal + residual, 残差超阈值就是异常", "跑深度学习模型", "做傅里叶变换"],
      correct: 1,
      explanation: "STL (Seasonal-Trend-Loess) 分解把时序拆成趋势、季节性、残差 3 部分。残差应该接近白噪声,超出 N 倍标准差就是异常。",
    },
  ],

  /* ============== v13.1 MLOps ============== */
  "mlops/model-versioning": [
    {
      question: "MLflow Tracking 主要记录什么?",
      options: ["用户登录信息", "实验参数 (params) + 指标 (metrics) + artifact (模型文件)", "服务器日志", "网络请求"],
      correct: 1,
      explanation: "MLflow Tracking 记录实验的超参数、评估指标、模型文件等,让实验可复现。配合 mlflow ui 可视化对比。",
    },
    {
      question: "Model Registry 中模型的生命周期阶段是?",
      options: ["None → Staging → Production → Archived", "alpha → beta → release", "test → dev → prod", "draft → review → published"],
      correct: 0,
      explanation: "MLflow Model Registry 的标准流程: None (刚注册) → Staging (测试中) → Production (线上) → Archived (下线)。",
    },
  ],
  "mlops/model-deployment": [
    {
      question: "FastAPI 部署模型时, joblib.load 应该放在哪?",
      options: ["每个请求进来时", "服务启动时 (全局变量)", "数据库里", "客户端"],
      correct: 1,
      explanation: "joblib.load 应该放在服务启动时 (全局变量), 而不是每个请求都重新加载。否则会严重拖慢响应 (一次加载几秒)。",
    },
    {
      question: "uwsgi/uvicorn 的 workers 数量经验值是?",
      options: ["1", "等于 CPU 核数", "2 × CPU 核数 + 1", "100"],
      correct: 2,
      explanation: "经验公式 workers = 2 × CPU_cores + 1。太多会切换开销大,太少 CPU 利用率低。容器里看 cgroup CPU 配额。",
    },
  ],
  "mlops/monitoring-drift": [
    {
      question: "KS 检验适合检测什么类型特征的漂移?",
      options: ["类别特征", "连续特征", "时间特征", "文本特征"],
      correct: 1,
      explanation: "Kolmogorov-Smirnov 检验比较两个连续分布,适合连续特征。类别特征用卡方检验,业务风控常用 PSI。",
    },
    {
      question: "数据漂移的 3 大类是?",
      options: ["前向漂移 / 后向漂移 / 双向漂移", "Covariate shift / Label shift / Concept drift", "内部漂移 / 外部漂移 / 混合漂移", "季节漂移 / 趋势漂移 / 随机漂移"],
      correct: 1,
      explanation: "数据漂移 3 大类: Covariate shift (输入 P(X) 变) / Label shift (输出 P(Y) 变) / Concept drift (关系 P(Y|X) 变)。Concept drift 最难发现。",
    },
  ],

  "cv-basics/cv-basics": [
    {
      question: "一张 RGB 彩色图像的三维张量 shape 是?",
      options: ["[H, W]", "[H, W, 3]", "[3, H, W]", "[H*W*3]"],
      correct: 1,
      explanation: "彩色图像 shape [H, W, 3], 三通道 RGB",
    },
    {
      question: "3x3 水平边缘检测卷积核, 中间行通常是什么?",
      options: ["全 1", "全 0", "全 -1", "梯度值"],
      correct: 1,
      explanation: "中间行 0, 上下两行对比突出水平边缘",
    },
    {
      question: "Sobel 算子用来检测什么?",
      options: ["颜色", "纹理", "边缘/梯度", "形状"],
      correct: 2,
      explanation: "Sobel 是经典边缘检测算子",
    },
    {
      question: "深度学习时代, 传统 SIFT/HOG 特征工程地位如何?",
      options: ["主流", "退场", "更重要", "不可替代"],
      correct: 1,
      explanation: "深度 CNN 自动学特征, 手工特征基本退场",
    },
    {
      question: "开运算 (opening) 的过程是?",
      options: ["先膨胀后腐蚀", "先腐蚀后膨胀", "只腐蚀", "只膨胀"],
      correct: 1,
      explanation: "开运算先腐蚀去小点, 再膨胀恢复主体",
    },
  ],
  "image-classification/image-classification": [
    {
      question: "LeNet-5 是哪一年提出的?",
      options: ["1989", "1998", "2005", "2012"],
      correct: 1,
      explanation: "LeNet-5 1998 年 Yann LeCun 提出",
    },
    {
      question: "AlexNet 在 ImageNet 2012 比赛的关键创新不包括?",
      options: ["ReLU", "Dropout", "GPU 训练", "Transformer"],
      correct: 3,
      explanation: "Transformer 是 2017 才提出, 跟 AlexNet 无关",
    },
    {
      question: "ResNet 的核心创新是?",
      options: ["更大卷积核", "残差连接", "更多全连接", "更浅网络"],
      correct: 1,
      explanation: "y = F(x) + x 残差连接解决梯度消失",
    },
    {
      question: "VGG-16 全部用多大卷积核?",
      options: ["1x1", "3x3", "5x5", "7x7"],
      correct: 1,
      explanation: "VGG 全部 3x3 卷积, 证明小核堆叠更好",
    },
    {
      question: "ResNet-152 在 ImageNet Top-5 错误率约多少?",
      options: ["15%", "7%", "3.57%", "1%"],
      correct: 2,
      explanation: "ResNet-152 Top-5 错误率 3.57%, 超越人类",
    },
  ],
  "object-detection/object-detection": [
    {
      question: "两阶段检测器典型流程是?",
      options: ["直接回归", "先候选区再分类", "只看一次", "聚类"],
      correct: 1,
      explanation: "两阶段: 候选框 + 分类/回归",
    },
    {
      question: "Faster R-CNN 的关键创新是?",
      options: ["YOLO", "RPN", "SSD", "FCN"],
      correct: 1,
      explanation: "Faster R-CNN 用 RPN 端到端生成候选框",
    },
    {
      question: "YOLO 的核心思想?",
      options: ["两阶段", "只看一次", "三阶段", "分块"],
      correct: 1,
      explanation: "YOLO = You Only Look Once, 一次 CNN 搞定",
    },
    {
      question: "IoU 是指?",
      options: ["分类置信度", "预测框与真实框交并比", "像素准确率", "mAP"],
      correct: 1,
      explanation: "IoU = 交集 / 并集, 检测框重合度",
    },
    {
      question: "实时场景最适合哪个?",
      options: ["R-CNN", "Faster R-CNN", "YOLOv8", "Mask R-CNN"],
      correct: 2,
      explanation: "YOLOv8 实时性好, 工业首选",
    },
  ],
  "image-segmentation/image-segmentation": [
    {
      question: "语义分割给每个像素输出什么?",
      options: ["bbox", "类别", "mask", "深度"],
      correct: 1,
      explanation: "语义分割给每个像素分类, 不区分个体",
    },
    {
      question: "U-Net 跳跃连接是?",
      options: ["Add", "Concat", "Multiply", "无"],
      correct: 1,
      explanation: "U-Net 用 Concat 融合浅深层特征",
    },
    {
      question: "Mask R-CNN 加了什么分支?",
      options: ["分类", "bbox", "FCN mask", "深度"],
      correct: 2,
      explanation: "Mask R-CNN = Faster R-CNN + FCN mask 分支",
    },
    {
      question: "mIoU 是?",
      options: ["平均交并比", "最大 IOU", "最小 IOU", "标准差"],
      correct: 0,
      explanation: "mIoU = mean IoU, 多类 IoU 平均",
    },
    {
      question: "医学影像分割最常用?",
      options: ["YOLO", "ResNet", "U-Net", "R-CNN"],
      correct: 2,
      explanation: "U-Net 小数据集也能训, 医学分割首选",
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
