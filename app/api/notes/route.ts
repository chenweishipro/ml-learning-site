// 学习笔记 API
import { getCurrentUser } from "@/lib/auth";
import { createNote, listNotes } from "@/lib/notes";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const url = new URL(req.url);
  const courseSlug = url.searchParams.get("courseSlug");
  const chapterSlug = url.searchParams.get("chapterSlug");
  if (!courseSlug || !chapterSlug) return fail("缺少 courseSlug/chapterSlug", 400);
  const notes = await listNotes({ userId: viewer.id, courseSlug, chapterSlug });
  return ok({ notes });
}

export async function POST(req: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const body = await readJson<{
    courseSlug?: string;
    chapterSlug?: string;
    highlightedText?: string;
    content?: string;
    color?: "yellow" | "red" | "green" | "blue";
  }>(req);
  if (!body || !body.courseSlug || !body.chapterSlug) {
    return fail("缺少 courseSlug/chapterSlug", 400);
  }
  const result = await createNote({
    userId: viewer.id,
    courseSlug: body.courseSlug,
    chapterSlug: body.chapterSlug,
    highlightedText: body.highlightedText ?? "",
    content: body.content ?? "",
    color: body.color,
  });
  if (!result.ok) return fail(result.error, 400);
  return ok({ note: result.data });
}
