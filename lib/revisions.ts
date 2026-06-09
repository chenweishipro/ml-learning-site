// 内容修订历史 (snapshot / list / rollback)
import { prisma } from "@/lib/db";

export type RevisionScope = "course" | "chapter";

/** 课程快照(包含元信息 + body) */
export interface CourseSnapshot {
  title: string | null;
  description: string | null;
  level: string | null;
  duration: string | null;
  tags: string | null;
  body: string | null;
}

/** 章节快照(就是 MDX body) */
export type ChapterSnapshot = string;

/**
 * 为课程内容打一份快照 (保存当前 override 的状态)
 * 在写新值之前调用, 把旧值存为快照
 */
export async function snapshotCourseOverride(opts: {
  courseSlug: string;
  userId: string;
  source?: "save" | "rollback" | "initial";
  summary?: string;
  restoredFrom?: string;
}): Promise<void> {
  const existing = await prisma.courseOverride.findUnique({
    where: { courseSlug: opts.courseSlug },
  });

  // 没有 override 的话, 不用保存快照 (这意味着是首次创建)
  if (!existing) return;

  // 把当前值打包成 JSON 字符串
  const snapshot: CourseSnapshot = {
    title: existing.title,
    description: existing.description,
    level: existing.level,
    duration: existing.duration,
    tags: existing.tags,
    body: existing.body,
  };

  await prisma.contentRevision.create({
    data: {
      scope: "course",
      courseSlug: opts.courseSlug,
      chapterSlug: null,
      body: JSON.stringify(snapshot),
      summary: opts.summary ?? null,
      source: opts.source ?? "save",
      restoredFrom: opts.restoredFrom ?? null,
      userId: opts.userId,
    },
  });
}

/**
 * 为章节内容打一份快照
 * 同上, 在写新值之前调用
 */
export async function snapshotChapterOverride(opts: {
  courseSlug: string;
  chapterSlug: string;
  userId: string;
  source?: "save" | "rollback" | "initial";
  summary?: string;
  restoredFrom?: string;
}): Promise<void> {
  const existing = await prisma.chapterOverride.findUnique({
    where: {
      courseSlug_chapterSlug: {
        courseSlug: opts.courseSlug,
        chapterSlug: opts.chapterSlug,
      },
    },
  });

  if (!existing) return;

  await prisma.contentRevision.create({
    data: {
      scope: "chapter",
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug,
      body: existing.body, // 章节 body 是 MDX 字符串
      summary: opts.summary ?? null,
      source: opts.source ?? "save",
      restoredFrom: opts.restoredFrom ?? null,
      userId: opts.userId,
    },
  });
}

/** 列出某 (scope, courseSlug, chapterSlug) 的所有快照 (倒序: 最新优先) */
export async function listRevisions(opts: {
  scope: RevisionScope;
  courseSlug: string;
  chapterSlug?: string;
  limit?: number;
}) {
  return prisma.contentRevision.findMany({
    where: {
      scope: opts.scope,
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug ?? null,
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    include: {
      user: {
        select: { id: true, email: true, displayName: true, role: true },
      },
    },
  });
}

/** 拿一个快照的 body (已经 JSON 化或原 MDX) */
export async function getRevision(id: string) {
  return prisma.contentRevision.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, email: true, displayName: true, role: true },
      },
    },
  });
}

/** 反序列化课程快照 */
export function parseCourseSnapshot(body: string): CourseSnapshot | null {
  try {
    return JSON.parse(body) as CourseSnapshot;
  } catch {
    return null;
  }
}

/**
 * 回滚到指定快照
 * - 先把当前 override 状态保存为快照 (source: 'rollback')
 * - 然后用快照里的值覆盖 override
 * - 不删除快照本身, 历史保留
 *
 * @returns { ok, error?, data: { courseSlug, chapterSlug?, scope } }
 */
export async function rollbackToRevision(opts: {
  revisionId: string;
  userId: string;
}) {
  const revision = await prisma.contentRevision.findUnique({
    where: { id: opts.revisionId },
  });
  if (!revision) {
    return { ok: false as const, error: "快照不存在" };
  }

  if (revision.scope === "course") {
    const snap = parseCourseSnapshot(revision.body);
    if (!snap) {
      return { ok: false as const, error: "快照数据损坏" };
    }

    // 把当前 override 状态打一份快照 (用于审计)
    await snapshotCourseOverride({
      courseSlug: revision.courseSlug,
      userId: opts.userId,
      source: "rollback",
      summary: `回滚到 ${revision.createdAt.toISOString()} 之前的版本`,
      restoredFrom: revision.id,
    });

    // 写入历史快照里的值
    await prisma.courseOverride.upsert({
      where: { courseSlug: revision.courseSlug },
      create: {
        courseSlug: revision.courseSlug,
        ...snap,
      },
      update: snap,
    });

    return {
      ok: true as const,
      data: { scope: "course" as const, courseSlug: revision.courseSlug },
    };
  }

  if (revision.scope === "chapter") {
    if (!revision.chapterSlug) {
      return { ok: false as const, error: "章节快照缺少 chapterSlug" };
    }

    // 把当前 override 状态打一份快照
    await snapshotChapterOverride({
      courseSlug: revision.courseSlug,
      chapterSlug: revision.chapterSlug,
      userId: opts.userId,
      source: "rollback",
      summary: `回滚到 ${revision.createdAt.toISOString()} 之前的版本`,
      restoredFrom: revision.id,
    });

    // 写入历史快照
    await prisma.chapterOverride.upsert({
      where: {
        courseSlug_chapterSlug: {
          courseSlug: revision.courseSlug,
          chapterSlug: revision.chapterSlug,
        },
      },
      create: {
        courseSlug: revision.courseSlug,
        chapterSlug: revision.chapterSlug,
        body: revision.body,
      },
      update: {
        body: revision.body,
      },
    });

    return {
      ok: true as const,
      data: {
        scope: "chapter" as const,
        courseSlug: revision.courseSlug,
        chapterSlug: revision.chapterSlug,
      },
    };
  }

  return { ok: false as const, error: "未知 scope" };
}
