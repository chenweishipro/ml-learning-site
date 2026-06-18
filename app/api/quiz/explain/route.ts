/** 错题 AI 讲解 — 调 LLM 根据错题 + 章节内容针对性讲解 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getQuiz } from "@/lib/quizzes";
import { getLLMProvider } from "@/lib/llm";
import { readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 内存缓存 (process 内, hot path)
const cache = new Map<string, { explanation: string; createdAt: number }>();
const TTL = 24 * 60 * 60 * 1000; // 24h

function cacheKey(opts: { courseSlug: string; chapterSlug: string; questionIndex: number; userAnswer: number }) {
  return crypto.createHash("sha256").update(JSON.stringify(opts)).digest("hex");
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { courseSlug?: string; chapterSlug?: string; questionIndex?: number; userAnswer?: number; force?: boolean } | null;
  if (!body?.courseSlug || !body?.chapterSlug || body?.questionIndex === undefined || body?.userAnswer === undefined) {
    return NextResponse.json({ error: "缺少 courseSlug/chapterSlug/questionIndex/userAnswer" }, { status: 400 });
  }
  const { courseSlug, chapterSlug, questionIndex, userAnswer, force } = body;

  // 1) 查 quiz 题
  const questions = getQuiz(courseSlug, chapterSlug);
  const q = questions[questionIndex];
  if (!q) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

  // 2) 缓存命中
  const key = cacheKey({ courseSlug, chapterSlug, questionIndex, userAnswer });
  if (!force) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.createdAt < TTL) {
      return NextResponse.json({ explanation: hit.explanation, cached: true });
    }
  }

  // 3) 读 mdx 章节内容 (限长, 跟 AI 出题共用)
  let content = "";
  try {
    const file = path.join(process.cwd(), "content", "courses", courseSlug, `${chapterSlug}.mdx`);
    let raw = await readFile(file, "utf8");
    raw = raw
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/^import .+$/gm, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/```[\s\S]*?```/g, "")
      .trim();
    content = raw.length > 3500 ? raw.slice(0, 3500) + "..." : raw;
  } catch {}

  // 4) 拼 prompt
  const userAnsText = q.options[userAnswer] ?? "(未作答)";
  const correctAnsText = q.options[q.correct] ?? "(未知)";
  const prompt = `你是一位经验丰富的 ML 老师. 一位学员做错了一道题, 请给他详细讲解.

【题目】
${q.question}

【选项】
${q.options.map((o, i) => `${["A", "B", "C", "D"][i]}. ${o}`).join("\n")}

【学员选择】${["A", "B", "C", "D"][userAnswer] ?? "?"}. ${userAnsText}
【正确答案】${["A", "B", "C", "D"][q.correct]}. ${correctAnsText}

【章节内容 (节选)】
${content}

请按以下结构回答 (中文, 200-400 字):
1. **为什么错**: 学员选错最可能的思维误区是什么
2. **正确答案为什么对**: 核心原理, 引用章节的具体点
3. **避免再错**: 一句话 tips

不要 markdown 标题符号, 用平实段落.`;

  const llm = getLLMProvider();
  let explanation = "";
  try {
    explanation = await llm.chat(
      [{ role: "user", content: prompt }],
      { temperature: 0.3, maxTokens: 1000 }
    );
  } catch (e) {
    explanation = `【AI 讲解生成失败】\n\n正确答案: ${correctAnsText}\n原题解释: ${q.explanation ?? "(无)"}`;
  }

  // 缓存
  cache.set(key, { explanation, createdAt: Date.now() });

  return NextResponse.json({ explanation, cached: false, model: llm.name });
}
