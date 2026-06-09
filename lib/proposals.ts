// 内容修改提案 (PR 模式) — 状态机
//   draft     →  (用户保存, 暂未开放)
//   pending   →  (用户提交, 等待审核)
//   approved  →  (管理员批准, 等待合并)
//   merged    →  (已合并, 已写入 override + 创建 ContentRevision + 通知作者)
//   rejected  →  (管理员拒绝, 终态)
//   withdrawn →  (作者撤回, 终态)
//
// 合并流程:
//   1. 校验: 状态必须是 approved 或 pending (允许跳过批准直接合并)
//   2. 冲突检测: 当前内容跟 baseSnapshot 是否一致?
//      - 一致: 继续合并
//      - 不一致: 报错 CONFLICT, 让 admin 决定是否强制合并
//   3. 写入 override (跟 admin 直接编辑一样)
//   4. 创建 ContentRevision 快照
//   5. 更新 proposal 状态 (merged + 关联 revision)
//   6. 给作者发站内信

import { prisma } from "./db";
import { snapshotChapterOverride, snapshotCourseOverride } from "./revisions";
import { createNotification } from "./notifications";
import { isAdmin, isSuperAdmin } from "./admin";
import { getCurrentUser } from "./auth";

export type ProposalStatus = "pending" | "approved" | "merged" | "rejected" | "withdrawn";
export type ProposalScope = "course" | "chapter";

interface CreateProposalOpts {
  authorId: string;
  scope: ProposalScope;
  courseSlug: string;
  chapterSlug?: string;
  title: string;
  description: string;
  proposedBody: string;
  baseSnapshot: string;
}

export async function createProposal(opts: CreateProposalOpts) {
  // 章节 body 不能超过 500KB
  if (opts.proposedBody.length > 500_000) {
    return { ok: false as const, error: "内容超过 500KB 上限" };
  }
  if (!opts.title.trim()) {
    return { ok: false as const, error: "请填写提案标题" };
  }
  if (!opts.description.trim()) {
    return { ok: false as const, error: "请填写修改说明" };
  }
  if (opts.scope === "chapter" && !opts.chapterSlug) {
    return { ok: false as const, error: "章节提案必须提供 chapterSlug" };
  }

  const created = await prisma.contentProposal.create({
    data: {
      authorId: opts.authorId,
      scope: opts.scope,
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug ?? null,
      title: opts.title.trim().slice(0, 200),
      description: opts.description.trim().slice(0, 2000),
      proposedBody: opts.proposedBody,
      baseSnapshot: opts.baseSnapshot,
      status: "pending",
    },
  });

  return { ok: true as const, data: created };
}

interface ListOpts {
  status?: ProposalStatus | "all";
  authorId?: string; // 限制只看某人的
  scope?: ProposalScope;
  courseSlug?: string;
  chapterSlug?: string;
  limit?: number;
  /** 当前用户 (用于权限控制: 非 admin 只能看自己的) */
  viewer: { id: string; role: string };
}

export async function listProposals(opts: ListOpts) {
  const where: any = {};
  if (opts.status && opts.status !== "all") where.status = opts.status;
  if (opts.authorId) where.authorId = opts.authorId;
  if (opts.scope) where.scope = opts.scope;
  if (opts.courseSlug) where.courseSlug = opts.courseSlug;
  if (opts.chapterSlug) where.chapterSlug = opts.chapterSlug;

  // 非 admin 只能看自己的 + 公共 (merged) 的
  if (!isAdmin(opts.viewer.role)) {
    where.OR = [
      { authorId: opts.viewer.id },
      { status: "merged" },
    ];
  }

  return prisma.contentProposal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    include: {
      author: {
        select: { id: true, email: true, displayName: true, role: true },
      },
      reviewer: {
        select: { id: true, email: true, displayName: true, role: true },
      },
    },
  });
}

export async function getProposal(id: string, viewer: { id: string; role: string }) {
  const p = await prisma.contentProposal.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, email: true, displayName: true, role: true },
      },
      reviewer: {
        select: { id: true, email: true, displayName: true, role: true },
      },
    },
  });
  if (!p) return null;

  // 权限: 自己的 OR 公共 (merged) OR admin
  if (
    !isAdmin(viewer.role) &&
    p.authorId !== viewer.id &&
    p.status !== "merged"
  ) {
    return null; // 隐藏, 当作不存在
  }

  return p;
}

export async function getProposalStats(viewer: { id: string; role: string }) {
  // 待审核 (admin 才看得到这个数字)
  const pending = isAdmin(viewer.role)
    ? await prisma.contentProposal.count({ where: { status: "pending" } })
    : 0;
  // 我的待审 (我提交的还没合并的)
  const mine = await prisma.contentProposal.count({
    where: {
      authorId: viewer.id,
      status: { in: ["pending", "approved"] },
    },
  });
  // 公共 (已合并) 总数
  const merged = await prisma.contentProposal.count({ where: { status: "merged" } });
  return { pending, mine, merged };
}

/** 撤回 (作者本人) */
export async function withdrawProposal(opts: { id: string; userId: string }) {
  const p = await prisma.contentProposal.findUnique({ where: { id: opts.id } });
  if (!p) return { ok: false as const, error: "提案不存在" };
  if (p.authorId !== opts.userId) {
    return { ok: false as const, error: "只能撤回自己的提案" };
  }
  if (p.status !== "pending" && p.status !== "approved") {
    return { ok: false as const, error: `当前状态 (${p.status}) 不允许撤回` };
  }
  const updated = await prisma.contentProposal.update({
    where: { id: opts.id },
    data: { status: "withdrawn" },
  });
  return { ok: true as const, data: updated };
}

/** 批准 (admin) */
export async function approveProposal(opts: { id: string; reviewerId: string; reviewNote?: string }) {
  const p = await prisma.contentProposal.findUnique({ where: { id: opts.id } });
  if (!p) return { ok: false as const, error: "提案不存在" };
  if (p.status !== "pending") {
    return { ok: false as const, error: `当前状态 (${p.status}) 不允许批准` };
  }
  const updated = await prisma.contentProposal.update({
    where: { id: opts.id },
    data: {
      status: "approved",
      reviewerId: opts.reviewerId,
      reviewNote: opts.reviewNote?.slice(0, 1000) ?? null,
      reviewedAt: new Date(),
    },
  });
  return { ok: true as const, data: updated };
}

/** 拒绝 (admin) */
export async function rejectProposal(opts: { id: string; reviewerId: string; reviewNote: string }) {
  const p = await prisma.contentProposal.findUnique({ where: { id: opts.id } });
  if (!p) return { ok: false as const, error: "提案不存在" };
  if (p.status !== "pending" && p.status !== "approved") {
    return { ok: false as const, error: `当前状态 (${p.status}) 不允许拒绝` };
  }
  if (!opts.reviewNote.trim()) {
    return { ok: false as const, error: "拒绝时必须填写理由" };
  }
  const updated = await prisma.contentProposal.update({
    where: { id: opts.id },
    data: {
      status: "rejected",
      reviewerId: opts.reviewerId,
      reviewNote: opts.reviewNote.slice(0, 1000),
      reviewedAt: new Date(),
    },
  });
  return { ok: true as const, data: updated };
}

interface MergeOpts {
  id: string;
  reviewerId: string;
  /** 强制合并: 跳过冲突检测 (默认 false) */
  force?: boolean;
  reviewNote?: string;
}

export async function mergeProposal(opts: MergeOpts) {
  const p = await prisma.contentProposal.findUnique({ where: { id: opts.id } });
  if (!p) return { ok: false as const, error: "提案不存在" };
  if (p.status !== "pending" && p.status !== "approved") {
    return { ok: false as const, error: `当前状态 (${p.status}) 不允许合并` };
  }

  // 冲突检测: 当前 override 是否跟 baseSnapshot 一致?
  let conflict: { hasConflict: boolean; currentBody: string; currentSource: "override" | "file" | "none" } = {
    hasConflict: false,
    currentBody: "",
    currentSource: "none",
  };

  if (p.scope === "chapter") {
    const existing = await prisma.chapterOverride.findUnique({
      where: {
        courseSlug_chapterSlug: {
          courseSlug: p.courseSlug,
          chapterSlug: p.chapterSlug!,
        },
      },
    });
    const currentBody = existing?.body ?? null; // null = 没 override, 用文件
    conflict.currentBody = currentBody ?? p.baseSnapshot; // 文件没存, fallback 到 base
    conflict.currentSource = existing ? "override" : "file";
    if (currentBody !== null && currentBody !== p.baseSnapshot) {
      conflict.hasConflict = true;
    }
  } else {
    // 课程元信息: 暂不支持 proposal (暂时不实现)
    return { ok: false as const, error: "课程元信息提案暂未实现" };
  }

  if (conflict.hasConflict && !opts.force) {
    return {
      ok: false as const,
      error: "CONFLICT",
      data: {
        hasConflict: true,
        currentBody: conflict.currentBody,
        baseSnapshot: p.baseSnapshot,
      },
    };
  }

  // 写入 override + 创建 revision
  let revisionId: string;
  if (p.scope === "chapter") {
    // 1. 先给当前 override 状态打快照
    await snapshotChapterOverride({
      courseSlug: p.courseSlug,
      chapterSlug: p.chapterSlug!,
      userId: opts.reviewerId,
      source: "save",
      summary: `合并提案 ${p.id} (作者: ${p.authorId})`,
    });

    // 2. 写入新 override
    const upserted = await prisma.chapterOverride.upsert({
      where: {
        courseSlug_chapterSlug: {
          courseSlug: p.courseSlug,
          chapterSlug: p.chapterSlug!,
        },
      },
      create: {
        courseSlug: p.courseSlug,
        chapterSlug: p.chapterSlug!,
        body: p.proposedBody,
      },
      update: { body: p.proposedBody },
    });
    revisionId = upserted.id;
  } else {
    return { ok: false as const, error: "课程元信息提案暂未实现" };
  }

  // 3. 更新 proposal 状态
  const updated = await prisma.contentProposal.update({
    where: { id: opts.id },
    data: {
      status: "merged",
      reviewerId: opts.reviewerId,
      reviewNote: opts.reviewNote?.slice(0, 1000) ?? null,
      reviewedAt: new Date(),
      mergedAt: new Date(),
      mergedRevisionId: revisionId,
    },
  });

  // 4. 给作者发站内信 (感谢贡献!)
  try {
    const author = await prisma.user.findUnique({
      where: { id: p.authorId },
      select: { email: true, displayName: true },
    });
    const reviewer = await prisma.user.findUnique({
      where: { id: opts.reviewerId },
      select: { email: true, displayName: true },
    });
    const course = await prisma.courseOverride.findUnique({
      where: { courseSlug: p.courseSlug },
      select: { title: true },
    });
    // 课程基础标题 (override 拿不到时, 这个 fallback)
    const courseTitle = course?.title ?? p.courseSlug;
    const reviewerName = reviewer?.displayName || reviewer?.email || "管理员";
    const link = `/proposals/${p.id}`;

    const scopeText = p.scope === "chapter" ? "章节" : "课程";
    const whereText = p.scope === "chapter"
      ? `课程《${courseTitle}》/ 章节 ${p.chapterSlug}`
      : `课程《${courseTitle}》`;

    await createNotification({
      recipientId: p.authorId,
      type: "proposal_merged",
      title: `🎉 你的修改建议已被采纳`,
      body: `${reviewerName} 合并了你在 ${whereText} 的提案「${p.title}」。感谢你的贡献!`,
      link,
      meta: {
        proposalId: p.id,
        courseSlug: p.courseSlug,
        chapterSlug: p.chapterSlug,
        scope: p.scope,
        reviewerId: opts.reviewerId,
      },
    });

    // 也给超级管理员发一份审计通知
    const superAdmins = await prisma.user.findMany({
      where: { role: "superadmin", NOT: { id: p.authorId } },
      select: { id: true },
    });
    for (const sa of superAdmins) {
      await createNotification({
        recipientId: sa.id,
        type: "system",
        title: `📝 ${author?.displayName || author?.email || "用户"} 提交了内容修改, 已被合并`,
        body: `提案「${p.title}」(${scopeText} / ${whereText}) 已被 ${reviewerName} 合并。`,
        link,
        meta: {
          proposalId: p.id,
          action: "merged",
        },
      });
    }
  } catch (e) {
    // 通知失败不应阻塞主流程
    console.error("Failed to send merge notification:", e);
  }

  return {
    ok: true as const,
    data: updated,
    revisionId,
    conflict,
  };
}
