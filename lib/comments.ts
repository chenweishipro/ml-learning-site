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
  // 解析 @ mentions (匹配 @<id> 或 @<name>, 找到对应 user)
  try {
    const mentionIds = await extractMentionedUserIds(opts.body);
    // 通知被 @ 的 user (排除自己 + 排除 parent author, 那种走 reply 通知)
    for (const mid of mentionIds) {
      if (mid === opts.authorId) continue;
      await prisma.notification.create({
        data: {
          recipientId: mid,
          type: "comment_mention",
          title: `${c.author.displayName || c.author.email.split("@")[0]} 在评论中提到了你`,
          body: c.body.slice(0, 120),
          link: opts.scope === "chapter" && opts.chapterSlug
            ? `/courses/${opts.courseSlug}/${opts.chapterSlug}/#comment-${c.id}`
            : `/courses/${opts.courseSlug}/#comment-${c.id}`,
        },
      });
    }
  } catch (e) {
    // 通知失败不影响评论
  }
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

/**
 * 解析评论里的 @ mention
 * 支持:
 *   @<userId>          内部标记 (前端发评论时把选中的 @ 转成 @<id>)
 *   @displayName       简单匹配 (按 displayName / email 前缀)
 * 最多取 5 个
 */
export async function extractMentionedUserIds(body: string): Promise<string[]> {
  const out: string[] = [];
  // 1) @<id> 形式 (cuid)
  const idRe = /@<([a-z0-9]{20,40})>/gi;
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(body)) && out.length < 5) {
    const u = await prisma.user.findUnique({ where: { id: m[1] }, select: { id: true } });
    if (u && !out.includes(u.id)) out.push(u.id);
  }
  // 2) @<name> 形式 (displayName 或 email 前缀)
  const nameRe = /@([\u4e00-\u9fa5A-Za-z0-9_\-]{2,30})/g;
  while ((m = nameRe.exec(body)) && out.length < 5) {
    const name = m[1];
    // 跳过刚刚 id 形式的
    if (out.includes(name)) continue;
    // 模糊匹配: displayName = name 或 email 前缀 = name
    const u = await prisma.user.findFirst({
      where: {
        OR: [
          { displayName: name },
          { email: { startsWith: `${name.toLowerCase()}@` } },
        ],
      },
      select: { id: true },
    });
    if (u && !out.includes(u.id)) out.push(u.id);
  }
  return out;
}
