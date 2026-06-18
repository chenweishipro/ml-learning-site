/** 成就/勋章 catalog */
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tier: BadgeTier;
  /** 自动检查逻辑: 返回是否达成 + context 描述 */
  check: (state: BadgeState) => Promise<{ earned: boolean; context?: string }>;
}

export interface BadgeState {
  userId: string;
  // 用户当前统计
  chaptersCompleted: number;     // 累计完成章节数
  coursesCompleted: number;      // 完整学完的课程数 (>=80% 章节)
  quizzesPassed: number;         // 答对的题数
  consecutiveDays: number;       // 当前连续学习天数
  longestStreak: number;         // 历史最长连续
  totalHours: number;            // 累计学习小时
  codingChallengesPassed: number; // 编程题全部通过次数
  commentsCount: number;
  notesCount: number;
  proposalsApproved: number;
  wrongResolvedAll: boolean;      // 错题本全部清空
  certificatesCount: number;
}

export const BADGES: Badge[] = [
  {
    id: "first-step",
    name: "初出茅庐",
    description: "完成第一个章节",
    emoji: "🌱",
    tier: "bronze",
    check: async (s) => s.chaptersCompleted >= 1 ? { earned: true, context: "1 chapter" } : { earned: false },
  },
  {
    id: "persistence-7",
    name: "七天之约",
    description: "连续学习 7 天",
    emoji: "🔥",
    tier: "bronze",
    check: async (s) => s.consecutiveDays >= 7 || s.longestStreak >= 7 ? { earned: true, context: `${Math.max(s.consecutiveDays, s.longestStreak)} days` } : { earned: false },
  },
  {
    id: "persistence-30",
    name: "月行不息",
    description: "连续学习 30 天",
    emoji: "🌙",
    tier: "silver",
    check: async (s) => s.consecutiveDays >= 30 || s.longestStreak >= 30 ? { earned: true, context: `${Math.max(s.consecutiveDays, s.longestStreak)} days` } : { earned: false },
  },
  {
    id: "course-completist-1",
    name: "首课通关",
    description: "完成 1 门完整课程 (>=80% 章节)",
    emoji: "🎓",
    tier: "silver",
    check: async (s) => s.coursesCompleted >= 1 ? { earned: true, context: `${s.coursesCompleted} course` } : { earned: false },
  },
  {
    id: "course-completist-3",
    name: "三科结业",
    description: "完成 3 门完整课程",
    emoji: "🏆",
    tier: "gold",
    check: async (s) => s.coursesCompleted >= 3 ? { earned: true, context: `${s.coursesCompleted} courses` } : { earned: false },
  },
  {
    id: "quiz-master",
    name: "题海无涯",
    description: "答对 50 道测验题",
    emoji: "🧠",
    tier: "silver",
    check: async (s) => s.quizzesPassed >= 50 ? { earned: true, context: `${s.quizzesPassed} correct` } : { earned: false },
  },
  {
    id: "code-warrior",
    name: "码到成功",
    description: "通过 5 道编程挑战",
    emoji: "⚔️",
    tier: "gold",
    check: async (s) => s.codingChallengesPassed >= 5 ? { earned: true, context: `${s.codingChallengesPassed} passed` } : { earned: false },
  },
  {
    id: "hours-50",
    name: "五十小时",
    description: "累计学习 50 小时",
    emoji: "⏳",
    tier: "silver",
    check: async (s) => s.totalHours >= 50 ? { earned: true, context: `${Math.round(s.totalHours)}h` } : { earned: false },
  },
  {
    id: "hours-100",
    name: "百炼成钢",
    description: "累计学习 100 小时",
    emoji: "💎",
    tier: "gold",
    check: async (s) => s.totalHours >= 100 ? { earned: true, context: `${Math.round(s.totalHours)}h` } : { earned: false },
  },
  {
    id: "no-wrong",
    name: "再无错题",
    description: "清空错题本",
    emoji: "✨",
    tier: "gold",
    check: async (s) => s.wrongResolvedAll ? { earned: true, context: "0 wrong" } : { earned: false },
  },
  {
    id: "contributor",
    name: "热心贡献",
    description: "提交 1 个被采纳的提案",
    emoji: "💡",
    tier: "silver",
    check: async (s) => s.proposalsApproved >= 1 ? { earned: true, context: `${s.proposalsApproved} accepted` } : { earned: false },
  },
  {
    id: "scholar",
    name: "学者",
    description: "获得 1 张结业证书",
    emoji: "📜",
    tier: "gold",
    check: async (s) => s.certificatesCount >= 1 ? { earned: true, context: `${s.certificatesCount} cert` } : { earned: false },
  },
  {
    id: "invited",
    name: "新种子",
    description: "通过邀请码注册加入, 开启了你的 ML 学习之旅",
    emoji: "🌱",
    tier: "bronze",
    check: async (s) => {
      const { prisma } = await import("./db");
      const r = await prisma.inviteCode.findFirst({ where: { usedById: s.userId } });
      return r ? { earned: true, context: "invited" } : { earned: false };
    },
  },
  {
    id: "promoter-3",
    name: "破冰者",
    description: "成功邀请 3 位新同学",
    emoji: "🌟",
    tier: "bronze",
    check: async (s) => {
      const { prisma } = await import("./db");
      const c = await prisma.inviteCode.count({ where: { ownerId: s.userId, usedById: { not: null } } });
      return c >= 3 ? { earned: true, context: `${c} invited` } : { earned: false };
    },
  },
  {
    id: "promoter-10",
    name: "分享者",
    description: "成功邀请 10 位新同学",
    emoji: "💫",
    tier: "silver",
    check: async (s) => {
      const { prisma } = await import("./db");
      const c = await prisma.inviteCode.count({ where: { ownerId: s.userId, usedById: { not: null } } });
      return c >= 10 ? { earned: true, context: `${c} invited` } : { earned: false };
    },
  },
  {
    id: "promoter-30",
    name: "大使",
    description: "成功邀请 30 位新同学, ML 学习推广大使",
    emoji: "👑",
    tier: "gold",
    check: async (s) => {
      const { prisma } = await import("./db");
      const c = await prisma.inviteCode.count({ where: { ownerId: s.userId, usedById: { not: null } } });
      return c >= 30 ? { earned: true, context: `${c} invited` } : { earned: false };
    },
  },
];

export const TIER_META: Record<BadgeTier, { label: string; ring: string; bg: string; text: string }> = {
  bronze: { label: "铜", ring: "ring-amber-300/50", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-800 dark:text-amber-300" },
  silver: { label: "银", ring: "ring-slate-300/50", bg: "bg-slate-50 dark:bg-slate-950/20", text: "text-slate-700 dark:text-slate-300" },
  gold: { label: "金", ring: "ring-yellow-400/60", bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-800 dark:text-yellow-300" },
  platinum: { label: "铂", ring: "ring-cyan-400/60", bg: "bg-cyan-50 dark:bg-cyan-950/20", text: "text-cyan-700 dark:text-cyan-300" },
};
