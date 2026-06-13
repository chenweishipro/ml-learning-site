/** 公开用户主页数据聚合 */
import { prisma } from "@/lib/db";
import { BADGES, TIER_META } from "@/lib/badges";

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  joinedAt: string;
  // 统计
  stats: {
    chaptersCompleted: number;
    coursesCompleted: number;
    totalHours: number;
    consecutiveDays: number;
    commentsCount: number;
    notesCount: number;
    certificatesCount: number;
    badgesCount: number;
  };
  // 徽章 (已获)
  badges: Array<{
    id: string;
    name: string;
    emoji: string;
    tier: keyof typeof TIER_META;
    earnedAt: string;
  }>;
  // 证书
  certificates: Array<{
    serialNo: string;
    courseSlug: string;
    courseTitle: string;
    issuedAt: string;
    finalScore: number;
  }>;
  // 已学完课程
  completedCourses: Array<{ slug: string; title: string; progress: number }>;
  // 最近评论
  recentComments: Array<{
    id: string;
    body: string;
    courseSlug: string;
    chapterSlug: string | null;
    createdAt: string;
  }>;
  // 关注数
  followersCount: number;
  followingCount: number;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: { orderBy: { earnedAt: "desc" } },
      certificates: { orderBy: { issuedAt: "desc" } },
    },
  });
  if (!user) return null;
  if ((user.profilePublic ?? 1) === 0) {
    // 私有
    return null;
  }

  // 统计
  const [chaptersCompleted, totalSec, commentsCount, notesCount, followersCount, followingCount, recentComments] = await Promise.all([
    prisma.chapterProgress.count({ where: { userId, completed: true } }),
    prisma.studySession.aggregate({ where: { userId }, _sum: { durationSec: true } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.note.count({ where: { userId } }),
    prisma.userFollow.count({ where: { followeeId: userId } }).catch(() => 0),
    prisma.userFollow.count({ where: { followerId: userId } }).catch(() => 0),
    prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, body: true, courseSlug: true, chapterSlug: true, createdAt: true },
    }),
  ]);

  // 完整学完的课
  const { getAllCourses } = await import("@/lib/content");
  const courseMetas = getAllCourses();
  const completedCourses: Array<{ slug: string; title: string; progress: number }> = [];
  let coursesCompleted = 0;
  for (const c of courseMetas) {
    if (c.chapters.length === 0) continue;
    const done = await prisma.chapterProgress.count({
      where: { userId, completed: true, courseSlug: c.slug },
    });
    const progress = done / c.chapters.length;
    if (progress >= 0.8) {
      completedCourses.push({ slug: c.slug, title: c.title, progress });
      coursesCompleted++;
    }
  }
  completedCourses.sort((a, b) => b.progress - a.progress);

  // 连续天数
  const sessions = await prisma.studySession.findMany({
    where: { userId },
    select: { studyDate: true },
    orderBy: { studyDate: "desc" },
  });
  const datesSet = new Set(sessions.map((s) => String(s.studyDate).slice(0, 10)));
  let consecutiveDays = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (datesSet.has(key)) consecutiveDays++;
    else if (i > 0) break;
  }

  // 徽章
  const earnedMap = new Map(user.badges.map((b) => [b.badgeId, b.earnedAt]));
  const badges: PublicProfile["badges"] = [];
  for (const b of BADGES) {
    const at = earnedMap.get(b.id);
    if (at) {
      badges.push({
        id: b.id,
        name: b.name,
        emoji: b.emoji,
        tier: b.tier,
        earnedAt: at.toISOString(),
      });
    }
  }

  return {
    id: user.id,
    displayName: user.displayName || user.email.split("@")[0],
    avatarUrl: user.avatarUrl || null,
    bio: user.bio || null,
    role: user.role,
    joinedAt: user.createdAt.toISOString(),
    stats: {
      chaptersCompleted,
      coursesCompleted,
      totalHours: (totalSec._sum.durationSec || 0) / 3600,
      consecutiveDays,
      commentsCount,
      notesCount,
      certificatesCount: user.certificates.length,
      badgesCount: badges.length,
    },
    badges,
    certificates: user.certificates.map((c) => {
      const meta = courseMetas.find((m) => m.slug === c.courseSlug);
      return {
        serialNo: c.serialNo,
        courseSlug: c.courseSlug,
        courseTitle: meta?.title || c.courseSlug,
        issuedAt: c.issuedAt.toISOString(),
        finalScore: c.finalScore,
      };
    }),
    completedCourses,
    recentComments: recentComments.map((c) => ({
      id: c.id,
      body: c.body,
      courseSlug: c.courseSlug,
      chapterSlug: c.chapterSlug,
      createdAt: c.createdAt.toISOString(),
    })),
    followersCount,
    followingCount,
  };
}
