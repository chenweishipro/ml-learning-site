/** admin 概览统计 — 用户活跃 / 课程完成 / 章节热度 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    totalUsers,
    newUsersWeek,
    activeUsersDay,
    activeUsersWeek,
    totalChaptersCompleted,
    totalComments,
    totalNotes,
    totalBadges,
    totalInviteCodes,
    invitedUsers,
    topCoursesByCompletion,
    topChaptersByCompletion,
    topActiveUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(weekAgo) } } }),
    prisma.studySession.groupBy({ by: ["userId"], where: { studyDate: { gte: dayAgo } } }).then((r) => r.length).catch(() => 0),
    prisma.studySession.groupBy({ by: ["userId"], where: { studyDate: { gte: weekAgo } } }).then((r) => r.length).catch(() => 0),
    prisma.chapterProgress.count({ where: { completed: true } }),
    prisma.comment.count(),
    prisma.note.count(),
    prisma.userBadge.count(),
    prisma.inviteCode.count(),
    prisma.inviteCode.count({ where: { usedById: { not: null } } }),
    prisma.chapterProgress.groupBy({
      by: ["courseSlug"],
      where: { completed: true },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }).catch(() => [] as any),
    prisma.chapterProgress.groupBy({
      by: ["courseSlug", "chapterSlug"],
      where: { completed: true },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }).catch(() => [] as any),
    prisma.chapterProgress.groupBy({
      by: ["userId"],
      where: { completed: true },
      _count: { chapterSlug: true },
      orderBy: { _count: { chapterSlug: "desc" } },
      take: 10,
    }).catch(() => [] as any),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      users: {
        total: totalUsers,
        newThisWeek: newUsersWeek,
        activeToday: activeUsersDay,
        activeThisWeek: activeUsersWeek,
      },
      content: {
        totalChaptersCompleted,
        totalComments,
        totalNotes,
        totalBadges,
        totalInviteCodes,
        invitedUsers,
      },
      topCourses: topCoursesByCompletion.map((c: any) => ({ course: c.courseSlug, completions: c._count.userId })),
      topChapters: topChaptersByCompletion.map((c: any) => ({ course: c.courseSlug, chapter: c.chapterSlug, completions: c._count.userId })),
      topActiveUsers: topActiveUsers.map((u: any) => ({ userId: u.userId, chapters: u._count.chapterSlug })),
    },
  });
}
