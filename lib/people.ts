/** 学习圈: 找相似用户 (基于共同完成课程 + 学完率) */
import { prisma } from "@/lib/db";

export interface SimilarUser {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  sharedCourses: number;        // 共同完成课程数
  sharedCoursesSlugs: string[]; // 课程 slug
  myRate: number;               // 自己在这几门的完成率 (avg)
  theirRate: number;            // 对方的完成率
  lastActiveAt: string | null;
  follower: boolean;
  badgesCount: number;
}

export async function findSimilarUsers(userId: string, limit = 8): Promise<SimilarUser[]> {
  // 1) 拿自己完成课程
  const myDone = await prisma.chapterProgress.findMany({
    where: { userId, completed: true },
    select: { courseSlug: true },
  });
  const myDoneCourses = new Set(myDone.map((r) => r.courseSlug));
  if (myDoneCourses.size === 0) return [];

  // 2) 拿自己学完的章节 (count per course)
  const myPerCourse = new Map<string, number>();
  for (const r of myDone) {
    myPerCourse.set(r.courseSlug, (myPerCourse.get(r.courseSlug) ?? 0) + 1);
  }

  // 3) 拿所有公开 profile 的 user
  const candidates = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: userId } },
        { profilePublic: { not: 0 } },
      ],
    },
    select: {
      id: true, displayName: true, bio: true, avatarUrl: true,
      _count: { select: { badges: true, studySessions: true } },
    },
  });

  // 4) 拿这些 user 的章节进度
  const candIds = candidates.map((u) => u.id);
  const candProgress = await prisma.chapterProgress.findMany({
    where: { userId: { in: candIds }, completed: true },
    select: { userId: true, courseSlug: true },
  });
  const candPerCourse = new Map<string, Map<string, number>>(); // userId -> courseSlug -> count
  for (const r of candProgress) {
    if (!candPerCourse.has(r.userId)) candPerCourse.set(r.userId, new Map());
    const m = candPerCourse.get(r.userId)!;
    m.set(r.courseSlug, (m.get(r.courseSlug) ?? 0) + 1);
  }

  // 5) 拿 follow 关系
  const myFollows = await prisma.userFollow.findMany({
    where: { followerId: userId },
    select: { followeeId: true },
  });
  const myFollowSet = new Set(myFollows.map((f) => f.followeeId));

  // 6) 课程 slug -> title
  const { getAllCourses } = await import("@/lib/content");
  const courseMeta = new Map(getAllCourses().map((c) => [c.slug, c.title]));
  const totalChapters = new Map(getAllCourses().map((c) => [c.slug, c.chapters.length]));

  // 7) 计算共同 + 排序
  const result: SimilarUser[] = [];
  for (const u of candidates) {
    const candMap = candPerCourse.get(u.id);
    if (!candMap) continue;
    const shared: string[] = [];
    let mySum = 0, theirSum = 0;
    for (const slug of myDoneCourses) {
      const theirCount = candMap.get(slug) ?? 0;
      if (theirCount === 0) continue;
      shared.push(slug);
      const myTotal = totalChapters.get(slug) ?? 1;
      const theirTotal = totalChapters.get(slug) ?? 1;
      mySum += (myPerCourse.get(slug) ?? 0) / myTotal;
      theirSum += theirCount / theirTotal;
    }
    if (shared.length === 0) continue;
    const myRate = mySum / shared.length;
    const theirRate = theirSum / shared.length;
    result.push({
      id: u.id,
      displayName: u.displayName || u.id.slice(0, 6),
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      sharedCourses: shared.length,
      sharedCoursesSlugs: shared.slice(0, 3),
      myRate,
      theirRate,
      lastActiveAt: null,
      follower: myFollowSet.has(u.id),
      badgesCount: u._count.badges,
    });
  }
  result.sort((a, b) => b.sharedCourses - a.sharedCourses || b.badgesCount - a.badgesCount);
  return result.slice(0, limit);
}
