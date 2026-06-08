import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/progress  -> 返回当前用户所有进度
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");

  const records = await prisma.chapterProgress.findMany({
    where: { userId: user.id },
    select: { courseSlug: true, chapterSlug: true, completed: true, updatedAt: true },
  });
  return ok({ progress: records });
}

// POST /api/progress  -> 合并客户端传过来的进度 (并集)
// body: { items: [{ courseSlug, chapterSlug, completed }] }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");

  const body = await readJson<{
    items?: Array<{ courseSlug: string; chapterSlug: string; completed?: boolean }>;
  }>(req);
  if (!body || !Array.isArray(body.items)) return fail("请求格式错误", 400);

  // 合并:并集. 已完成的就是完成, 未完成的不能覆盖已完成的
  for (const item of body.items) {
    if (!item?.courseSlug || !item?.chapterSlug) continue;
    if (!item.completed) continue;
    await prisma.chapterProgress.upsert({
      where: {
        userId_courseSlug_chapterSlug: {
          userId: user.id,
          courseSlug: item.courseSlug,
          chapterSlug: item.chapterSlug,
        },
      },
      create: {
        userId: user.id,
        courseSlug: item.courseSlug,
        chapterSlug: item.chapterSlug,
        completed: true,
      },
      update: {},
    });
  }

  const records = await prisma.chapterProgress.findMany({
    where: { userId: user.id },
    select: { courseSlug: true, chapterSlug: true, completed: true, updatedAt: true },
  });
  return ok({ progress: records });
}

// DELETE /api/progress?courseSlug=...&chapterSlug=...  -> 取消完成
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");

  const { searchParams } = new URL(req.url);
  const courseSlug = searchParams.get("courseSlug");
  const chapterSlug = searchParams.get("chapterSlug");
  if (!courseSlug || !chapterSlug) return fail("缺少参数", 400);

  await prisma.chapterProgress
    .delete({
      where: {
        userId_courseSlug_chapterSlug: {
          userId: user.id,
          courseSlug,
          chapterSlug,
        },
      },
    })
    .catch(() => {
      // ignore not-found
    });
  return ok({ deleted: true });
}
