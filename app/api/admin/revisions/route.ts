// 管理员: 列出某 (scope, courseSlug, chapterSlug) 的快照
import { requireAdmin } from "@/lib/admin";
import { listRevisions, getRevision } from "@/lib/revisions";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

/**
 * GET /api/admin/revisions?scope=course&courseSlug=ml-basics
 * GET /api/admin/revisions?scope=chapter&courseSlug=ml-basics&chapterSlug=what-is-ml
 * GET /api/admin/revisions?id=abc123  (拿一个完整快照)
 */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    const rev = await getRevision(id);
    if (!rev) return fail("快照不存在", 404);
    return ok({ revision: rev });
  }

  const scope = url.searchParams.get("scope") as "course" | "chapter" | null;
  const courseSlug = url.searchParams.get("courseSlug");
  const chapterSlug = url.searchParams.get("chapterSlug") || undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50");

  if (!scope || (scope !== "course" && scope !== "chapter")) {
    return fail("scope 必须是 course 或 chapter", 400);
  }
  if (!courseSlug) {
    return fail("缺少 courseSlug", 400);
  }
  if (scope === "chapter" && !chapterSlug) {
    return fail("scope=chapter 时必须提供 chapterSlug", 400);
  }

  const revisions = await listRevisions({
    scope,
    courseSlug,
    chapterSlug,
    limit: Math.min(limit, 200),
  });

  return ok({ revisions });
}
