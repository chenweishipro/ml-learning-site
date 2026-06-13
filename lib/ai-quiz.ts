/** AI 自动出题 — 从章节内容生成多选题
 * 触发: 章节 Quiz 组件加载时, 当静态题库为空时
 * 缓存: in-memory + fs (content/courses/.ai-quiz-cache/)
 */
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getLLMProvider } from "./llm";

export interface AIQuizQuestion {
  question: string;
  options: string[];
  correct: number; // 0-3
  explanation: string;
  source: "ai";
  model?: string;
}

const CACHE_DIR = path.join(process.cwd(), "content", "courses", ".ai-quiz-cache");

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
}

function cacheKey(courseSlug: string, chapterSlug: string, content: string): string {
  return crypto.createHash("sha256").update(`${courseSlug}/${chapterSlug}:${content.length}`).digest("hex").slice(0, 16);
}

async function readCache(key: string): Promise<AIQuizQuestion[] | null> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data?.questions)) return data.questions;
  } catch {}
  return null;
}

async function writeCache(key: string, questions: AIQuizQuestion[], model: string) {
  try {
    await ensureCacheDir();
    await fs.writeFile(
      path.join(CACHE_DIR, `${key}.json`),
      JSON.stringify({ questions, model, createdAt: new Date().toISOString() }, null, 2)
    );
  } catch (e) {
    // ignore
  }
}

const PROMPT = `你是一位机器学习老师. 请根据下面章节内容, 出 5 道多选题, 每道 4 个选项 (a/b/c/d), 1 个正确答案, 并给出解释.

要求:
1. 题干用中文, 简洁清晰, 围绕核心概念
2. 干扰项有迷惑性但可通过原文知识排除
3. 解释 1-2 句, 引用章节具体点
4. 严格按 JSON 格式输出, 不要 markdown 代码块, 不要其他文字

JSON 格式 (用 \\n 换行):
[{"q":"题目","opts":["A","B","C","D"],"correct":0,"exp":"解释"}, ...]

章节内容:
`;

export async function generateAIQuiz(
  courseSlug: string,
  chapterSlug: string,
  content: string,
  opts: { force?: boolean; count?: number } = {}
): Promise<{ questions: AIQuizQuestion[]; cached: boolean; model: string }> {
  const count = opts.count ?? 5;
  const key = cacheKey(courseSlug, chapterSlug, content);
  if (!opts.force) {
    const cached = await readCache(key);
    if (cached && cached.length >= count) {
      return { questions: cached.slice(0, count), cached: true, model: "cache" };
    }
  }
  // 截断内容避免超 token
  const truncated = content.length > 6000 ? content.slice(0, 6000) + "\n...(略)..." : content;
  const prompt = PROMPT.replace("5 道", `${count} 道`) + truncated;
  const llm = getLLMProvider();
  const raw = await llm.chat([
    { role: "user", content: prompt },
  ], { temperature: 0.4, maxTokens: 2000 });

  // 解析 JSON
  let parsed: any[] = [];
  try {
    // 抓取第一个 [...] 块
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
  } catch {
    // 重试: 模拟 mock
    parsed = [];
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    // fallback: 模拟 1 题让前端不挂
    parsed = [
      { q: `${chapterSlug} 的核心概念是?`, opts: ["数据驱动", "规则驱动", "随机", "手工"], correct: 0, exp: "章节强调从数据学规律" }
    ];
  }
  const questions: AIQuizQuestion[] = parsed.slice(0, count).map((q: any) => ({
    question: String(q.q ?? q.question ?? "题目"),
    options: Array.isArray(q.opts) ? q.opts.slice(0, 4) : (Array.isArray(q.options) ? q.options.slice(0, 4) : ["A", "B", "C", "D"]),
    correct: Math.max(0, Math.min(3, Number(q.correct ?? 0))),
    explanation: String(q.exp ?? q.explanation ?? ""),
    source: "ai" as const,
    model: llm.name,
  }));

  await writeCache(key, questions, llm.name);
  return { questions, cached: false, model: llm.name };
}
