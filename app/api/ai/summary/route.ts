import { NextResponse } from "next/server";
import { getAISummary } from "@/lib/ai-summary";
import { getChapterWithOverrides } from "@/lib/content-overrides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/ai/summary?course=X&chapter=Y — 拿 AI 摘要 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const course = url.searchParams.get("course");
  const chapter = url.searchParams.get("chapter");
  if (!course || !chapter) {
    return NextResponse.json({ ok: false, error: "course/chapter 必填" }, { status: 400 });
  }
  const data = await getChapterWithOverrides(course, chapter);
  if (!data) {
    return NextResponse.json({ ok: false, error: "章节不存在" }, { status: 404 });
  }
  try {
    const summary = await getAISummary(course, chapter, data.content);
    return NextResponse.json({ ok: true, data: { summary } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "生成失败" },
      { status: 500 }
    );
  }
}
