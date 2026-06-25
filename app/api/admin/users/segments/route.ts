/** 用户分群 — 基于行为自动计算用户标签 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

type Segment =
  | "newbie"           // 7 天内注册
  | "active-7d"        // 7 天内有 studySession
  | "active-30d"       // 30 天内活跃
  | "dormant"          // 30 天以上无活动
  | "power-user"       // 完成 >= 10 章
  | "completionist"    // 完成 >= 30 章
  | "quiz-master"      // 平均 quiz >= 90
  | "contributor";     // 提交过作业 + 评论 >= 5

interface SegmentedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  lastActive: string | null;
  stats: {
    chaptersCompleted: number;
    quizAttempts: number;
    avgScore: number;
    comments: number;
    notes: number;
    submissions: number;
  };
  segments: Segment[];
}

async function getUserSegments(userIds: string[], users: any[]): Promise<Map<string, Set<Segment>>> {
  const now = Date.now();
  const day7 = new Date(now - 7 * DAY_MS);
  const day30 = new Date(now - 30 * DAY_MS);

  const [studySessions, chapterProgress, quizAgg, comments, notes, submissions] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId: { in: userIds }, studyDate: { gte: day30.toISOString().slice(0, 10) } },
      select: { userId: true, studyDate: true },
    }),
    prisma.chapterProgress.findMany({
      where: { userId: { in: userIds }, completed: true },
      select: { userId: true },
    }),
    prisma.quizAttempt.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { id: true },
      _avg: { score: true },
    }),
    prisma.comment.groupBy({
      by: ["authorId"],
      where: { authorId: { in: userIds } },
      _count: { id: true },
    }),
    prisma.note.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { id: true },
    }),
    prisma.submission.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { id: true },
    }),
  ]);

  // 按用户聚合
  const lastActive = new Map<string, string>();
  for (const s of studySessions) {
    const cur = lastActive.get(s.userId);
    if (!cur || s.studyDate > cur) lastActive.set(s.userId, s.studyDate);
  }
  const chapterCount = new Map<string, number>();
  for (const c of chapterProgress) {
    chapterCount.set(c.userId, (chapterCount.get(c.userId) ?? 0) + 1);
  }
  const quizMap = new Map(quizAgg.map((q) => [q.userId, { count: q._count.id, avg: Math.round(q._avg.score ?? 0) }]));
  const commentMap = new Map(comments.map((c) => [c.authorId, c._count.id]));
  const noteMap = new Map(notes.map((n) => [n.userId, n._count.id]));
  const subMap = new Map(submissions.map((s) => [s.userId, s._count.id]));

  const result = new Map<string, Set<Segment>>();
  for (const uid of userIds) {
    const set = new Set<Segment>();
    // newbie: 7 天内注册
    const user = users.find((u) => u.id === uid);
    if (user && (now - user.createdAt.getTime()) <= 7 * DAY_MS) set.add("newbie");

    const last = lastActive.get(uid);
    if (last && last >= day7.toISOString().slice(0, 10)) set.add("active-7d");
    else if (last && last >= day30.toISOString().slice(0, 10)) set.add("active-30d");
    else if (!last && user && (now - user.createdAt.getTime()) > 30 * DAY_MS) set.add("dormant");
    else if (!last) set.add("dormant");

    const chapters = chapterCount.get(uid) ?? 0;
    if (chapters >= 30) set.add("completionist");
    else if (chapters >= 10) set.add("power-user");

    const q = quizMap.get(uid);
    if (q && q.count >= 3 && q.avg >= 90) set.add("quiz-master");

    if ((subMap.get(uid) ?? 0) > 0 && (commentMap.get(uid) ?? 0) >= 5) set.add("contributor");

    result.set(uid, set);
  }
  return result;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const segment = url.searchParams.get("segment") as Segment | null;
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500, // 拉多一些, 内存分群
    select: {
      id: true, email: true, displayName: true, role: true, createdAt: true, avatarUrl: true,
    },
  });

  const segments = await getUserSegments(users.map((u) => u.id), users);
  // 聚合统计每个 segment 的人数
  const segmentCount: Record<string, number> = {};
  for (const set of segments.values()) {
    for (const s of set) {
      segmentCount[s] = (segmentCount[s] ?? 0) + 1;
    }
  }

  // 过滤
  let filtered = users;
  if (segment) {
    filtered = users.filter((u) => segments.get(u.id)?.has(segment));
  }

  const chapterCountMap = new Map<string, number>();
  const allProgress = await prisma.chapterProgress.findMany({
    where: { userId: { in: filtered.map((u) => u.id) }, completed: true },
    select: { userId: true },
  });
  for (const c of allProgress) {
    chapterCountMap.set(c.userId, (chapterCountMap.get(c.userId) ?? 0) + 1);
  }

  const data: SegmentedUser[] = filtered.slice(0, limit).map((u) => {
    const segs = segments.get(u.id) ?? new Set();
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      lastActive: null, // 上面算过, 简化不返回
      stats: {
        chaptersCompleted: chapterCountMap.get(u.id) ?? 0,
        quizAttempts: 0,
        avgScore: 0,
        comments: 0,
        notes: 0,
        submissions: 0,
      },
      segments: Array.from(segs),
    };
  });

  return NextResponse.json({ ok: true, data, segmentCount, total: filtered.length });
}
