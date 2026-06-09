// AI 润色文本 (用于 proposal)
import { getLLMProvider } from "@/lib/llm";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

interface PolishRequest {
  text: string;
  /** 可选上下文: chapter title, course title, etc. */
  context?: {
    courseTitle?: string;
    chapterTitle?: string;
  };
  /** 模式: proofread=纠错润色, rewrite=重写优化 */
  mode?: "proofread" | "rewrite";
}

export async function POST(req: Request) {
  let body: PolishRequest;
  try {
    body = (await req.json()) as PolishRequest;
  } catch {
    return fail("Invalid JSON", 400);
  }
  if (!body.text?.trim()) return fail("text is required", 400);
  if (body.text.length > 20000) return fail("text too long (max 20000 chars)", 400);

  const mode = body.mode ?? "proofread";
  const context = body.context;

  // Mock 模式: 简单清洗文本 (去多余空格、统一标点)
  const provider = getLLMProvider();
  let result: { polished: string; changes: number; provider: string };

  if (provider.name === "mock-extractive") {
    // Mock 润色: 简单清洗
    let polished = body.text
      .replace(/[ \t]+/g, " ") // 多空格合并
      .replace(/。\s*。+/g, "。") // 多个句号
      .replace(/，\s*，+/g, "，") // 多个逗号
      .replace(/^[\s\n]+|[\s\n]+$/g, "") // 去首尾空白
      .replace(/\n{3,}/g, "\n\n"); // 多换行合并
    if (mode === "rewrite") {
      // 简单润色: 句首添加连接词
      polished = polished.replace(/^([^\n。！？]{5,50})/gm, "建议: $1");
    }
    const changes = (body.text.length - polished.length) + (body.text.match(/[ \t]+/g)?.length ?? 0) * 2;
    result = { polished, changes, provider: provider.name };
  } else {
    // 真实 LLM 调用
    const contextInfo = context
      ? `(${context.courseTitle ?? ""}${context.chapterTitle ? ` / ${context.chapterTitle}` : ""})`
      : "";
    const systemPrompt = `你是一个机器学习教材的 AI 校对编辑${contextInfo}。
请${mode === "rewrite" ? "重写以改善表述" : "修正错别字、标点、语序"}用户提交的内容。
要求:
1. 保持原意, 不要改变作者观点
2. 保持中文风格, 专业但易懂
3. 修正明显的错别字 (例如: '机其学习' → '机器学习')
4. 输出纯文本, 不要加解释
5. 如果原文已经很好了, 直接返回原文

只返回润色后的文本, 不要加引号/前缀。`;

    try {
      const polished = await provider.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: body.text },
      ], { maxTokens: 4000, temperature: 0.3 });
      const changes = Math.abs(polished.length - body.text.length);
      result = { polished: polished.trim(), changes, provider: provider.name };
    } catch (e) {
      return fail(e instanceof Error ? e.message : "润色失败", 500);
    }
  }

  return ok(result);
}
