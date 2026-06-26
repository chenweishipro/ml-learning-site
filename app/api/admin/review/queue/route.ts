/** admin 内容审核队列 — proposals + submissions + comments */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [pendingProposals, pendingSubmissions, recentApproved] = await Promise.all([
    prisma.contentProposal.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 30,
      include: {
        author: { select: { id: true, displayName: true, email: true } },
      },
    }),
    // 待人工 review 的作业 (status != reviewed, 已有 score = 自动评分, 等 teacher confirm)
    prisma.submission.findMany({
      where: { status: { in: ["submitted", "auto-graded"] } },
      orderBy: { submittedAt: "asc" },
      take: 30,
      include: {
        user: { select: { id: true, displayName: true, email: true } },
        assignment: { select: { id: true, title: true, courseSlug: true } },
      },
    }),
    // 最近已处理 (审计用)
    prisma.submission.findMany({
      where: { status: "reviewed" },
      orderBy: { gradedAt: "desc" },
      take: 10,
      include: {
        user: { select: { displayName: true, email: true } },
        assignment: { select: { title: true } },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      proposals: pendingProposals.map((p) => ({
        id: p.id,
        type: "proposal" as const,
        title: p.title,
        description: p.description,
        scope: p.scope,
        courseSlug: p.courseSlug,
        chapterSlug: p.chapterSlug,
                author: p.author,
        createdAt: p.createdAt.toISOString(),
      })),
      submissions: pendingSubmissions.map((s) => ({
        id: s.id,
        assignmentId: s.assignmentId,
        type: "submission" as const,
        title: s.assignment.title,
        courseSlug: s.assignment.courseSlug,
        content: s.content.slice(0, 200) + (s.content.length > 200 ? "..." : ""),
        autoScore: s.score,
        status: s.status,
        matchDetail: s.matchDetail,
        user: s.user,
        submittedAt: s.submittedAt.toISOString(),
      })),
      recentReviewed: recentApproved.map((s) => ({
        id: s.id,
        title: s.assignment.title,
        score: s.score,
        user: s.user,
        gradedAt: s.gradedAt?.toISOString() ?? null,
      })),
      counts: {
        proposalsPending: pendingProposals.length,
        submissionsPending: pendingSubmissions.length,
      },
    },
  });
}
