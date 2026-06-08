// 管理员: 读取/更新课程元数据
import { requireAdmin, logEdit } from "@/lib/admin";
import { getCourseWithOverrides } from "@/lib/content-overrides";
import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const course = await getCourseWithOverrides(params.slug);
  if (!course) return fail("课程不存在", 404);

  const ov = await prisma.courseOverride.findUnique({ where: { courseSlug: params.slug } });

  return ok({
    course,
    override: ov,
    hasOverride: !!ov,
  });
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const course = await getCourseWithOverrides(params.slug);
  if (!course) return fail("课程不存在", 404);

  const body = await readJson<{
    title?: string | null;
    description?: string | null;
    level?: "beginner" | "intermediate" | "advanced" | null;
    duration?: string | null;
    tags?: string[] | null;
  }>(req);
  if (!body) return fail("请求格式错误", 400);

  // level 校验
  if (body.level && !["beginner", "intermediate", "advanced"].includes(body.level)) {
    return fail("level 取值必须是 beginner/intermediate/advanced", 400);
  }

  // tags 必须是数组
  if (body.tags !== undefined && body.tags !== null && !Array.isArray(body.tags)) {
    return fail("tags 必须是字符串数组", 400);
  }

  const tagsJson = body.tags === null ? null : body.tags ? JSON.stringify(body.tags) : undefined;

  const upserted = await prisma.courseOverride.upsert({
    where: { courseSlug: params.slug },
    create: {
      courseSlug: params.slug,
      title: body.title ?? null,
      description: body.description ?? null,
      level: body.level ?? null,
      duration: body.duration ?? null,
      tags: tagsJson,
    },
    update: {
      title: body.title === undefined ? undefined : body.title,
      description: body.description === undefined ? undefined : body.description,
      level: body.level === undefined ? undefined : body.level,
      duration: body.duration === undefined ? undefined : body.duration,
      tags: tagsJson === undefined ? undefined : tagsJson,
    },
  });

  // 写日志
  await logEdit({
    userId: auth.user.id,
    scope: "course",
    courseSlug: params.slug,
    courseRefId: upserted.id,
    action: "save",
    summary: body.title ?? body.description ?? undefined,
  });

  return ok({ course: await getCourseWithOverrides(params.slug) });
}

export async function DELETE(_req: Request, { params }: { params: { slug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const ov = await prisma.courseOverride.findUnique({ where: { courseSlug: params.slug } });
  if (!ov) return ok({ deleted: false });

  await prisma.courseOverride.delete({ where: { id: ov.id } });
  await logEdit({
    userId: auth.user.id,
    scope: "course",
    courseSlug: params.slug,
    action: "delete",
  });
  return ok({ deleted: true });
}
