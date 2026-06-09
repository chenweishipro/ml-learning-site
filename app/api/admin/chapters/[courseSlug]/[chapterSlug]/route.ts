// 管理员: 读取/更新/重置章节 MDX
import { requireAdmin, logEdit } from "@/lib/admin";
import { getChapterWithOverrides } from "@/lib/content-overrides";
import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";
import { snapshotChapterOverride } from "@/lib/revisions";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { courseSlug: string; chapterSlug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const data = await getChapterWithOverrides(params.courseSlug, params.chapterSlug);
  if (!data) return fail("章节不存在", 404);

  return ok({
    meta: data.meta,
    content: data.content,
    hasOverride: data.hasOverride,
  });
}

export async function PUT(req: Request, { params }: { params: { courseSlug: string; chapterSlug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const data = await getChapterWithOverrides(params.courseSlug, params.chapterSlug);
  if (!data) return fail("章节不存在", 404);

  const body = await readJson<{ body?: string }>(req);
  if (!body || typeof body.body !== "string") {
    return fail("body 字段必须是字符串", 400);
  }

  if (body.body.length > 500_000) {
    return fail("章节内容超过 500KB 上限", 413);
  }

  // 在写入新值前先给当前 override 打一份快照 (用于后续回滚)
  await snapshotChapterOverride({
    courseSlug: params.courseSlug,
    chapterSlug: params.chapterSlug,
    userId: auth.user.id,
    source: "save",
  });

  const upserted = await prisma.chapterOverride.upsert({
    where: {
      courseSlug_chapterSlug: {
        courseSlug: params.courseSlug,
        chapterSlug: params.chapterSlug,
      },
    },
    create: {
      courseSlug: params.courseSlug,
      chapterSlug: params.chapterSlug,
      body: body.body,
    },
    update: { body: body.body },
  });

  await logEdit({
    userId: auth.user.id,
    scope: "chapter",
    courseSlug: params.courseSlug,
    chapterSlug: params.chapterSlug,
    chapterRefId: upserted.id,
    action: "save",
    summary: body.body.slice(0, 200),
  });

  return ok({ saved: true, hasOverride: true });
}

export async function DELETE(_req: Request, { params }: { params: { courseSlug: string; chapterSlug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const ov = await prisma.chapterOverride.findUnique({
    where: {
      courseSlug_chapterSlug: {
        courseSlug: params.courseSlug,
        chapterSlug: params.chapterSlug,
      },
    },
  });
  if (!ov) return ok({ deleted: false });

  await prisma.chapterOverride.delete({ where: { id: ov.id } });
  await logEdit({
    userId: auth.user.id,
    scope: "chapter",
    courseSlug: params.courseSlug,
    chapterSlug: params.chapterSlug,
    action: "delete",
  });
  return ok({ deleted: true });
}
