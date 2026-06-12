// AI 章节摘要 — LLM 生成 200 字中文摘要
// 用 prisma 缓存: 1 章节 1 摘要, 用 invalidateAt 标记过期 (7 天)
import { prisma } from "./db";
import { getLLMProvider } from "./llm";

const TTL_DAYS = 7;
const MAX_TEXT = 4000; // 取章节前 4000 字送 LLM

/** 生成或拿缓存的 AI 摘要 */
export async function getAISummary(courseSlug: string, chapterSlug: string, content: string): Promise<string | null> {
  // 查专用 model
  const existing = await prisma.aiSummary.findUnique({
    where: { courseSlug_chapterSlug: { courseSlug, chapterSlug } },
  }).catch(() => null);

  if (existing) {
    const age = Date.now() - existing.updatedAt.getTime();
    if (age < TTL_DAYS * 24 * 3600 * 1000 && existing.content === hashContent(content)) {
      return existing.summary;
    }
  }

  // 生成
  const text = content.replace(/```[\s\S]*?```/g, "").slice(0, MAX_TEXT);
  if (text.length < 100) return null;

  const llm = getLLMProvider();
  const prompt = `请用 100-200 字为以下中文技术教程章节写一段摘要。要求:\n1. 用第三人称客观描述\n2. 列出 2-3 个核心概念\n3. 说明读者学完后能做什么\n4. 用中文, 句末用句号\n\n章节内容:\n${text}\n\n请只输出摘要正文, 不要任何前缀。`;

  let summary: string;
  try {
    summary = await llm.chat([{ role: "user", content: prompt }], { maxTokens: 320, temperature: 0.3 });
    summary = summary.trim();
    if (summary.length < 20 || summary.length > 600) return null;
  } catch {
    return null;
  }

  // 存 cache
  try {
    await prisma.aiSummary.upsert({
      where: { courseSlug_chapterSlug: { courseSlug, chapterSlug } },
      create: { courseSlug, chapterSlug, summary, content: hashContent(content) },
      update: { summary, content: hashContent(content), updatedAt: new Date() },
    });
  } catch {
    // 忽略 cache 失败
  }
  return summary;
}

function hashContent(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h.toString(36);
}
