import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAIQuiz } from "@/lib/ai-quiz";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/**
 * POST /api/ai/quiz
 * body: { courseSlug, chapterSlug, count?, force? }
 * 鉴权: 任意登录用户 (防滥用)
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { courseSlug?: string; chapterSlug?: string; count?: number; force?: boolean } | null;
  if (!body?.courseSlug || !body?.chapterSlug) {
    return NextResponse.json({ error: "缺少 courseSlug / chapterSlug" }, { status: 400 });
  }
  // 读 mdx 文件
  const file = path.join(process.cwd(), "content", "courses", body.courseSlug, `${body.chapterSlug}.mdx`);
  let content = "";
  try {
    content = await readFile(file, "utf8");
    // 去 frontmatter
    content = content.replace(/^---[\s\S]*?---\n?/, "");
    // 去 import / export / JSX 标签
    content = content
      .replace(/^import .*$/gm, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/```[\s\S]*?```/g, "")
      .trim();
  } catch {
    return NextResponse.json({ error: "章节不存在" }, { status: 404 });
  }
  const result = await generateAIQuiz(body.courseSlug, body.chapterSlug, content, {
    count: body.count ?? 5,
    force: body.force ?? false,
  });
  return NextResponse.json(result);
}
