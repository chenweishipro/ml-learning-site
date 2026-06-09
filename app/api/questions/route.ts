// Q&A 问题 API
import { getCurrentUser } from "@/lib/auth";
import { createQuestion, listQuestions } from "@/lib/qa";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = (url.searchParams.get("sort") ?? "newest") as any;
  const status = url.searchParams.get("status") as any;
  const search = url.searchParams.get("q") || undefined;
  const courseSlug = url.searchParams.get("courseSlug") || undefined;
  const chapterSlug = url.searchParams.get("chapterSlug") || undefined;
  const tag = url.searchParams.get("tag") || undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50");

  const questions = await listQuestions({
    sort,
    status,
    search,
    courseSlug,
    chapterSlug,
    tag,
    limit: Math.min(limit, 200),
  });
  return ok({ questions });
}

export async function POST(req: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const body = await readJson<{
    title?: string;
    body?: string;
    courseSlug?: string;
    chapterSlug?: string;
    tags?: string[];
  }>(req);
  if (!body) return fail("请求格式错误", 400);
  const result = await createQuestion({
    authorId: viewer.id,
    title: body.title ?? "",
    body: body.body ?? "",
    courseSlug: body.courseSlug,
    chapterSlug: body.chapterSlug,
    tags: body.tags,
  });
  if (!result.ok) return fail(result.error, 400);
  return ok({ question: result.data });
}
