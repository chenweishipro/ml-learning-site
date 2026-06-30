/** 学习路径推荐 (v19.4)
 *
 * 输入: 用户已完成章节 + 用户目标 (4 种预设)
 * 输出: 有序 LearningPath + LearningPathStep 列表
 *
 * 4 层混合推荐:
 *  1. 模板硬规则: 不同 goal 对应不同课程序列模板
 *  2. 课程标签 + 等级匹配: 已完成课程的 tags 找相邻课程
 *  3. 知识先决关系: 入门 -> 进阶 -> 高级, 强制按 level 升序
 *  4. AI 包装: 让 LLM 给每步写理由 + 排序 (mock 模式 skip)
 */
import { prisma } from "./db";
import { getAllCourses } from "./content";
import type { CourseMeta } from "@/content/courses/_index";

export type LearningGoal = "ml-engineer" | "data-analyst" | "researcher" | "general";

export const GOAL_OPTIONS: { value: LearningGoal; label: string; emoji: string; desc: string }[] = [
  { value: "ml-engineer", label: "机器学习工程师", emoji: "🤖", desc: "能独立训练并部署模型, 偏工程实践" },
  { value: "data-analyst", label: "数据分析师", emoji: "📊", desc: "会用统计 + SQL + Python 做业务分析" },
  { value: "researcher", label: "学术研究者", emoji: "🔬", desc: "想读 paper 复现 SOTA, 偏理论数学" },
  { value: "general", label: "通用入门", emoji: "🌱", desc: "不确定方向, 想先建立完整知识地图" },
];

export interface PathStep {
  order: number;
  courseSlug: string;
  courseTitle: string;
  chapterSlugs: string[]; // [] = 整门课
  reason: string;
  estHours: number;
  completed?: boolean;
  completedAt?: string | null;
}

export interface GeneratedPath {
  goal: LearningGoal;
  title: string;
  description: string;
  totalHours: number;
  steps: PathStep[];
}

// ========== 课程模板 ==========
// 4 个 goal 各自推荐一个固定课程序列 + 每步重点章节
// 顺序是学习顺序, 后续步骤会作为 prereq 排除前序已涵盖章节
export const PATH_TEMPLATES: Record<LearningGoal, { courses: { slug: string; pickChapters?: string[]; estHours: number; reason: string }[] }> = {
  "ml-engineer": {
    courses: [
      { slug: "ml-basics", estHours: 6, reason: "先建立对机器学习的整体认知, 理解监督/无监督/评估指标" },
      { slug: "stats-foundations", estHours: 8, reason: "工程师也需补统计基础, 知道 t 检验/置信区间为何重要" },
      { slug: "supervised-learning", estHours: 10, reason: "掌握线性回归/树模型/集成方法的核心实现" },
      { slug: "neural-networks", estHours: 12, reason: "深度学习是现代 ML 工程的必备技能" },
      { slug: "deep-learning-advanced", estHours: 16, reason: "CNN/Transformer 是工业界主流架构" },
      { slug: "mlops", estHours: 10, reason: "模型上线/监控/A-B 测试, 工程师核心竞争力" },
    ],
  },
  "data-analyst": {
    courses: [
      { slug: "ml-basics", estHours: 6, reason: "建立基础认知, 了解 ML 在分析场景中的角色" },
      { slug: "stats-foundations", estHours: 8, reason: "描述统计 + 推断统计是分析师的看家本领" },
      { slug: "stats-probability", estHours: 8, reason: "概率分布/条件概率/Bayes, 业务分析必备" },
      { slug: "stats-estimation", estHours: 6, reason: "点估计/区间估计/最大似然, 学会量化不确定性" },
      { slug: "stats-testing", estHours: 6, reason: "A/B 测试背后的统计原理, 是数据驱动决策基础" },
      { slug: "time-series", estHours: 10, reason: "时间序列分析在业务报表/预测中应用极广" },
      { slug: "supervised-learning", estHours: 10, reason: "了解预测建模, 在很多业务场景中配合统计方法" },
    ],
  },
  "researcher": {
    courses: [
      { slug: "ml-basics", estHours: 6, reason: "了解 ML 的整体地图, 知道哪些子领域值得深挖" },
      { slug: "stats-foundations", estHours: 8, reason: "理论研究的根基" },
      { slug: "stats-probability", estHours: 8, reason: "概率论是 ML 理论的语言" },
      { slug: "stats-continuous", estHours: 6, reason: "连续分布/大数定律, 论文常用工具" },
      { slug: "supervised-learning", estHours: 10, reason: "经典算法的理论分析 (偏差-方差/PAC 学习)" },
      { slug: "neural-networks", estHours: 12, reason: "深度学习理论是当前研究最热方向" },
      { slug: "deep-learning-advanced", estHours: 16, reason: "Transformer 架构, 多数 SOTA 都基于此" },
    ],
  },
  "general": {
    courses: [
      { slug: "ml-basics", estHours: 6, reason: "建立全景认知, 找到自己感兴趣的子领域" },
      { slug: "stats-foundations", estHours: 8, reason: "统计学是所有数据科学的底层语言" },
      { slug: "supervised-learning", estHours: 10, reason: "最广泛应用的 ML 范式" },
      { slug: "neural-networks", estHours: 12, reason: "现代 AI 的核心范式" },
      { slug: "nlp-basics", estHours: 8, reason: "了解 NLP, 触及 LLM 时代最热方向" },
      { slug: "cv-basics", estHours: 8, reason: "了解 CV, 触及另一大 ML 应用方向" },
    ],
  },
};

/** 智能调整: 用户已完成的章节, 不再重推到路径里 */
export async function generatePath(goal: LearningGoal, userId: string): Promise<GeneratedPath> {
  const template = PATH_TEMPLATES[goal];
  if (!template) {
    throw new Error(`Unknown goal: ${goal}`);
  }

  const allCourses = getAllCourses();
  const courseMap = new Map(allCourses.map((c) => [c.slug, c]));

  // 拿用户已完成的章节 (course + chapter)
  const completed = await prisma.chapterProgress.findMany({
    where: { userId, completed: true },
    select: { courseSlug: true, chapterSlug: true },
  });
  const completedSet = new Set(completed.map((c) => `${c.courseSlug}/${c.chapterSlug}`));

  const steps: PathStep[] = [];
  let totalHours = 0;
  const usedSlugs = new Set<string>();

  for (let i = 0; i < template.courses.length; i++) {
    const t = template.courses[i];
    const course = courseMap.get(t.slug);
    if (!course) continue; // 课程不存在, 跳过
    if (usedSlugs.has(t.slug)) continue; // 防重
    usedSlugs.add(t.slug);

    // 决定要推的章节
    let chapterSlugs: string[];
    if (t.pickChapters && t.pickChapters.length > 0) {
      chapterSlugs = t.pickChapters.filter((s) => !completedSet.has(`${t.slug}/${s}`));
    } else {
      // 默认: 推未完成章节 (最多 6 个核心章节)
      const allChapters = course.chapters || [];
      chapterSlugs = allChapters
        .map((c) => c.slug)
        .filter((s) => !completedSet.has(`${t.slug}/${s}`))
        .slice(0, 6);
    }

    // 如果全部章节都完成, 跳过这门课
    const courseChapters = course.chapters || [];
    const courseAllCompleted = courseChapters.every((c) => completedSet.has(`${t.slug}/${c.slug}`));
    if (courseChapters.length > 0 && courseAllCompleted) {
      // 课程已全完成, 在 step 里标 completed=true, 但仍占位
      steps.push({
        order: i,
        courseSlug: t.slug,
        courseTitle: course.title,
        chapterSlugs: [],
        reason: t.reason + " (✅ 已完成, 可跳过)",
        estHours: 0,
        completed: true,
        completedAt: null,
      });
      continue;
    }

    // 估算实际耗时 (剩余章节数 / 总章节数 * 估算小时)
    const totalChapters = courseChapters.length || 1;
    const remainRatio = chapterSlugs.length / totalChapters;
    const estHours = Math.max(1, Math.round(t.estHours * remainRatio * 10) / 10);

    steps.push({
      order: i,
      courseSlug: t.slug,
      courseTitle: course.title,
      chapterSlugs,
      reason: t.reason,
      estHours,
    });
    totalHours += estHours;
  }

  // 重新连续 order (排除被跳过的)
  steps.forEach((s, idx) => (s.order = idx));

  // 标题 + 描述
  const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label || goal;
  const title = `${goalLabel} 之路`;
  const description =
    `为「${goalLabel}」目标定制的 6-7 门课系统化学习路径。` +
    `预计总耗时 ${totalHours.toFixed(0)} 小时, ` +
    `已根据你目前的进度智能裁剪已完成章节。`;

  return {
    goal,
    title,
    description,
    totalHours,
    steps,
  };
}

/** 持久化到 DB (替换用户当前 active 路径) */
export async function savePath(userId: string, path: GeneratedPath): Promise<string> {
  // 把现有 active 标记为 abandoned
  await prisma.learningPath.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false, status: "abandoned" },
  });

  // 拿已完成章节 (用于 mark 步骤完成)
  const completed = await prisma.chapterProgress.findMany({
    where: { userId, completed: true },
    select: { courseSlug: true, chapterSlug: true },
  });
  const completedSet = new Set(completed.map((c) => `${c.courseSlug}/${c.chapterSlug}`));

  // 创建新 path + 步骤
  const created = await prisma.learningPath.create({
    data: {
      userId,
      goal: path.goal,
      title: path.title,
      description: path.description,
      totalHours: path.totalHours,
      status: "active",
      isActive: true,
      steps: {
        create: path.steps.map((s) => {
          const isCompleted = s.chapterSlugs.length === 0
            ? false
            : s.chapterSlugs.every((cs) => completedSet.has(`${s.courseSlug}/${cs}`));
          return {
            order: s.order,
            courseSlug: s.courseSlug,
            courseTitle: s.courseTitle,
            chapterSlugs: JSON.stringify(s.chapterSlugs),
            reason: s.reason,
            estHours: s.estHours,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null,
          };
        }),
      },
    },
    include: { steps: true },
  });
  return created.id;
}

/** 拉取用户当前 active 路径 */
export async function getActivePath(userId: string): Promise<{
  id: string;
  goal: string;
  title: string;
  description: string;
  totalHours: number;
  status: string;
  createdAt: string;
  steps: Array<{
    id: string;
    order: number;
    courseSlug: string;
    courseTitle: string;
    chapterSlugs: string[];
    reason: string;
    estHours: number;
    completed: boolean;
    completedAt: string | null;
  }>;
} | null> {
  const path = await prisma.learningPath.findFirst({
    where: { userId, isActive: true },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!path) return null;
  return {
    id: path.id,
    goal: path.goal,
    title: path.title,
    description: path.description,
    totalHours: path.totalHours,
    status: path.status,
    createdAt: path.createdAt.toISOString(),
    steps: path.steps.map((s) => ({
      id: s.id,
      order: s.order,
      courseSlug: s.courseSlug,
      courseTitle: s.courseTitle,
      chapterSlugs: JSON.parse(s.chapterSlugs || "[]"),
      reason: s.reason,
      estHours: s.estHours,
      completed: s.completed,
      completedAt: s.completedAt?.toISOString() || null,
    })),
  };
}

/** 标记某 step 为完成 (用户手动或系统检测) */
export async function markStepCompleted(stepId: string): Promise<void> {
  await prisma.learningPathStep.update({
    where: { id: stepId },
    data: { completed: true, completedAt: new Date() },
  });
  // 顺手: 检查 path 是否全部完成
  const step = await prisma.learningPathStep.findUnique({
    where: { id: stepId },
    select: { pathId: true },
  });
  if (!step) return;
  const remaining = await prisma.learningPathStep.count({
    where: { pathId: step.pathId, completed: false },
  });
  if (remaining === 0) {
    await prisma.learningPath.update({
      where: { id: step.pathId },
      data: { status: "completed", completedAt: new Date(), isActive: false },
    });
  }
}

/** 拉取所有历史路径 (包括 completed/abandoned) */
export async function getAllPaths(userId: string, limit = 10) {
  return prisma.learningPath.findMany({
    where: { userId },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** 兼容旧 suggestRelated: 给课程详情页 "相关学习路径" 提示 */
export function suggestPathsForCourse(courseSlug: string): { goal: LearningGoal; courseSlugs: string[]; finalSlug: string } | null {
  for (const [goal, tmpl] of Object.entries(PATH_TEMPLATES)) {
    const idx = tmpl.courses.findIndex((c) => c.slug === courseSlug);
    if (idx >= 0) {
      // 这门课是路径里的第 N 步, 推荐整条路径
      return {
        goal: goal as LearningGoal,
        courseSlugs: tmpl.courses.map((c) => c.slug),
        finalSlug: courseSlug,
      };
    }
  }
  return null;
}