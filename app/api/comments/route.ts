// 章节评论 API
import { getCurrentUser } from "@/lib/auth";
import { createComment, listComments } from "@/lib/comments";
import { isAdmin } from "@/lib/roles";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") as "course" | "chapter" | null;
  const courseSlug = url.searchParams.get("courseSlug");
  const chapterSlug = url.searchParams.get("chapterSlug") || undefined;
  const limit = Number(url.searchParams.get("limit") ?? "200");

  if (!scope || (scope !== "course" && scope !== "chapter")) {
    return fail("scope 必须是 course 或 chapter", 400);
  }
  if (!courseSlug) return fail("缺少 courseSlug", 400);
  if (scope === "chapter" && !chapterSlug) {
    return fail("scope=chapter 时必须提供 chapterSlug", 400);
  }

  const viewer = await getCurrentUser();
  const includeHidden = !!(viewer && isAdmin(viewer.role));
  const comments = await listComments({
    scope,
    courseSlug,
    chapterSlug,
    includeHidden,
    limit: Math.min(limit, 500),
  });
  return ok({ comments });
}

export async function POST(req: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const body = await readJson<{
    scope?: "course" | "chapter";
    courseSlug?: string;
    chapterSlug?: string;
    body?: string;
    parentId?: string;
  }>(req);
  if (!body) return fail("请求格式错误", 400);

  if (!body.scope || (body.scope !== "course" && body.scope !== "chapter")) {
    return fail("scope 必须是 course 或 chapter", 400);
  }
  if (!body.courseSlug) return fail("缺少 courseSlug", 400);

  const result = await createComment({
    authorId: viewer.id,
    scope: body.scope,
    courseSlug: body.courseSlug,
    chapterSlug: body.chapterSlug,
    body: body.body ?? "",
    parentId: body.parentId,
  });
  if (!result.ok) return fail(result.error, 400);
  return ok({ comment: result.data });
}
