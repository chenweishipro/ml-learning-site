// 章节评论 helper
import { prisma } from "./db";

export type CommentScope = "course" | "chapter";

interface CreateOpts {
  authorId: string;
  scope: CommentScope;
  courseSlug: string;
  chapterSlug?: string;
  body: string;
  parentId?: string;
}

export async function createComment(opts: CreateOpts) {
  if (!opts.body.trim()) return { ok: false as const, error: "评论内容不能为空" };
  if (opts.body.length > 2000) return { ok: false as const, error: "评论过长 (2000 字符以内)" };
  if (opts.scope === "chapter" && !opts.chapterSlug) {
    return { ok: false as const, error: "scope=chapter 时必须提供 chapterSlug" };
  }
  if (opts.parentId) {
    // 验证 parent 存在且属于同一 scope
    const parent = await prisma.comment.findUnique({ where: { id: opts.parentId } });
    if (!parent) return { ok: false as const, error: "回复的评论不存在" };
    if (parent.parentId) {
      // 不支持二级以上嵌套, 改为平铺
      opts.parentId = parent.parentId;
    }
  }
  const c = await prisma.comment.create({
    data: {
      authorId: opts.authorId,
      scope: opts.scope,
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug ?? null,
      body: opts.body.trim(),
      parentId: opts.parentId ?? null,
    },
    include: {
      author: { select: { id: true, email: true, displayName: true, role: true } },
    },
  });
  return { ok: true as const, data: c };
}

interface ListOpts {
  scope: CommentScope;
  courseSlug: string;
  chapterSlug?: string;
  /** 是否包含隐藏评论 (admin only) */
  includeHidden?: boolean;
  limit?: number;
}

export async function listComments(opts: ListOpts) {
  const where: any = {
    scope: opts.scope,
    courseSlug: opts.courseSlug,
    chapterSlug: opts.chapterSlug ?? null,
  };
  if (!opts.includeHidden) where.status = "published";
  return prisma.comment.findMany({
    where,
    orderBy: [{ parentId: "asc" }, { createdAt: "asc" }],
    take: opts.limit ?? 200,
    include: {
      author: { select: { id: true, email: true, displayName: true, role: true } },
      _count: { select: { likes: true } },
    },
  });
}

export async function deleteComment(opts: { id: string; userId: string; isAdmin: boolean }) {
  const c = await prisma.comment.findUnique({ where: { id: opts.id } });
  if (!c) return { ok: false as const, error: "评论不存在" };
  if (c.authorId !== opts.userId && !opts.isAdmin) {
    return { ok: false as const, error: "无权删除" };
  }
  // 软删: 标记 status=deleted, 但保留回复链
  await prisma.comment.update({
    where: { id: opts.id },
    data: { status: "deleted", body: "[已删除]" },
  });
  return { ok: true as const };
}

export async function toggleLikeComment(opts: { id: string; userId: string }) {
  const c = await prisma.comment.findUnique({ where: { id: opts.id } });
  if (!c) return { ok: false as const, error: "评论不存在" };
  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId: opts.id, userId: opts.userId } },
  });
  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    await prisma.comment.update({ where: { id: opts.id }, data: { likeCount: { decrement: 1 } } });
    return { ok: true as const, data: { liked: false, likeCount: c.likeCount - 1 } };
  } else {
    await prisma.commentLike.create({
      data: { commentId: opts.id, userId: opts.userId },
    });
    await prisma.comment.update({ where: { id: opts.id }, data: { likeCount: { increment: 1 } } });
    return { ok: true as const, data: { liked: true, likeCount: c.likeCount + 1 } };
  }
}

export async function hideComment(opts: { id: string; isAdmin: boolean }) {
  if (!opts.isAdmin) return { ok: false as const, error: "需要管理员权限" };
  await prisma.comment.update({ where: { id: opts.id }, data: { status: "hidden" } });
  return { ok: true as const };
}
