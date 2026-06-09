// Q&A helper
import { prisma } from "./db";

interface CreateQuestionOpts {
  authorId: string;
  title: string;
  body: string;
  courseSlug?: string;
  chapterSlug?: string;
  tags?: string[];
}

export async function createQuestion(opts: CreateQuestionOpts) {
  if (!opts.title.trim()) return { ok: false as const, error: "标题不能为空" };
  if (!opts.body.trim()) return { ok: false as const, error: "内容不能为空" };
  if (opts.title.length > 200) return { ok: false as const, error: "标题超过 200 字" };
  if (opts.body.length > 10000) return { ok: false as const, error: "内容超过 10000 字" };
  const q = await prisma.question.create({
    data: {
      authorId: opts.authorId,
      title: opts.title.trim().slice(0, 200),
      body: opts.body.trim().slice(0, 10000),
      courseSlug: opts.courseSlug ?? null,
      chapterSlug: opts.chapterSlug ?? null,
      tags: (opts.tags ?? []).slice(0, 10).join(","),
    },
  });
  return { ok: true as const, data: q };
}

interface ListOpts {
  courseSlug?: string;
  chapterSlug?: string;
  tag?: string;
  status?: "open" | "answered" | "closed";
  search?: string;
  sort?: "newest" | "votes" | "answers" | "views";
  limit?: number;
}

export async function listQuestions(opts: ListOpts) {
  const where: any = {};
  if (opts.courseSlug) where.courseSlug = opts.courseSlug;
  if (opts.chapterSlug) where.chapterSlug = opts.chapterSlug;
  if (opts.status) where.status = opts.status;
  if (opts.search) {
    where.OR = [
      { title: { contains: opts.search } },
      { body: { contains: opts.search } },
      { tags: { contains: opts.search } },
    ];
  }
  if (opts.tag) {
    where.tags = { contains: opts.tag };
  }
  const orderBy: any = (() => {
    switch (opts.sort) {
      case "votes": return { voteCount: "desc" };
      case "answers": return { answerCount: "desc" };
      case "views": return { viewCount: "desc" };
      case "newest":
      default: return { createdAt: "desc" };
    }
  })();
  return prisma.question.findMany({
    where,
    orderBy,
    take: opts.limit ?? 50,
    include: {
      author: { select: { id: true, email: true, displayName: true, role: true } },
    },
  });
}

export async function getQuestion(id: string) {
  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, email: true, displayName: true, role: true } },
      answers: {
        where: { status: "published" },
        orderBy: [{ accepted: "desc" }, { voteCount: "desc" }, { createdAt: "asc" }],
        include: {
          author: { select: { id: true, email: true, displayName: true, role: true } },
          _count: { select: { votes: true } },
        },
      },
    },
  });
  if (q) {
    // 浏览数 +1 (简单方式, 不去重)
    await prisma.question.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
  return q;
}

interface CreateAnswerOpts {
  questionId: string;
  authorId: string;
  body: string;
}

export async function createAnswer(opts: CreateAnswerOpts) {
  if (!opts.body.trim()) return { ok: false as const, error: "回答内容不能为空" };
  if (opts.body.length > 10000) return { ok: false as const, error: "内容超过 10000 字" };
  // 确认问题存在
  const q = await prisma.question.findUnique({ where: { id: opts.questionId } });
  if (!q) return { ok: false as const, error: "问题不存在" };
  if (q.status === "closed") return { ok: false as const, error: "问题已关闭, 无法回答" };
  const a = await prisma.answer.create({
    data: {
      questionId: opts.questionId,
      authorId: opts.authorId,
      body: opts.body.trim().slice(0, 10000),
    },
  });
  // 同步更新问题 answerCount
  await prisma.question.update({
    where: { id: opts.questionId },
    data: { answerCount: { increment: 1 } },
  });
  return { ok: true as const, data: a };
}

export async function acceptAnswer(opts: { questionId: string; answerId: string; userId: string; isAdmin: boolean }) {
  const q = await prisma.question.findUnique({ where: { id: opts.questionId } });
  if (!q) return { ok: false as const, error: "问题不存在" };
  // 只有问题作者或管理员可以采纳
  if (q.authorId !== opts.userId && !opts.isAdmin) {
    return { ok: false as const, error: "只有提问者或管理员可以采纳答案" };
  }
  const a = await prisma.answer.findUnique({ where: { id: opts.answerId } });
  if (!a || a.questionId !== opts.questionId) {
    return { ok: false as const, error: "答案不存在或不属于该问题" };
  }
  // 取消其他采纳
  await prisma.answer.updateMany({
    where: { questionId: opts.questionId, accepted: true, NOT: { id: opts.answerId } },
    data: { accepted: false },
  });
  // 采纳
  await prisma.answer.update({
    where: { id: opts.answerId },
    data: { accepted: true },
  });
  // 同步问题状态
  await prisma.question.update({
    where: { id: opts.questionId },
    data: { status: "answered" },
  });
  // 给答主发感谢站内信
  try {
    const { createNotification } = await import("./notifications");
    const acceptor = await prisma.user.findUnique({ where: { id: opts.userId }, select: { email: true, displayName: true } });
    await createNotification({
      recipientId: a.authorId,
      type: "system",
      title: "🎉 你的回答被采纳了!",
      body: `${acceptor?.displayName || acceptor?.email || "提问者"} 采纳了你在问题《${q.title}》的回答。`,
      link: `/qa/${opts.questionId}/`,
      meta: { questionId: opts.questionId, answerId: opts.answerId },
    });
  } catch (e) {
    // ignore
  }
  return { ok: true as const };
}

export async function voteAnswer(opts: { answerId: string; userId: string }) {
  const a = await prisma.answer.findUnique({ where: { id: opts.answerId } });
  if (!a) return { ok: false as const, error: "答案不存在" };
  const existing = await prisma.answerVote.findUnique({
    where: { answerId_userId: { answerId: opts.answerId, userId: opts.userId } },
  });
  if (existing) {
    await prisma.answerVote.delete({ where: { id: existing.id } });
    await prisma.answer.update({ where: { id: opts.answerId }, data: { voteCount: { decrement: 1 } } });
    return { ok: true as const, data: { voted: false, voteCount: a.voteCount - 1 } };
  } else {
    await prisma.answerVote.create({
      data: { answerId: opts.answerId, userId: opts.userId },
    });
    await prisma.answer.update({ where: { id: opts.answerId }, data: { voteCount: { increment: 1 } } });
    return { ok: true as const, data: { voted: true, voteCount: a.voteCount + 1 } };
  }
}
