// RAG: 从问题找相关章节, 拼 prompt, 调 LLM
import { semanticSearch } from "./semantic-search";
import { getLLMProvider, type LLMMessage } from "./llm";
import { getChapterWithOverrides } from "./content-overrides";

export interface ChatSource {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  /** 0..1 */
  score: number;
  /** 摘录的片段 */
  excerpt: string;
}

export interface ChatResult {
  answer: string;
  sources: ChatSource[];
  provider: string;
  model: string;
  query: string;
}

function makeExcerpt(text: string, query: string, maxLen = 400): string {
  const t = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*`>_\[\](){}|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = t.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
  let idx = -1;
  for (const w of words) {
    const found = lower.indexOf(w);
    if (found >= 0) {
      idx = found;
      break;
    }
  }
  if (idx < 0) {
    return t.slice(0, maxLen);
  }
  const start = Math.max(0, idx - 100);
  const end = Math.min(t.length, idx + maxLen);
  let excerpt = t.slice(start, end);
  if (start > 0) excerpt = "..." + excerpt;
  if (end < t.length) excerpt = excerpt + "...";
  return excerpt;
}

export async function ragChat(opts: { query: string; history?: LLMMessage[]; topK?: number }): Promise<ChatResult> {
  return ragChatInternal(opts);
}

/** 准备 RAG 上下文 (检索 + 拼 prompt)。返回 sources 和给 LLM 的 messages, 可复用。 */
export async function prepareRag(opts: { query: string; topK?: number }) {
  const q = opts.query.trim();
  const topK = opts.topK ?? 3;
  const searchResult = await semanticSearch({ query: q, limit: topK, level: "all" });
  const sources: ChatSource[] = [];
  const contextParts: string[] = [];
  for (const hit of searchResult.hits) {
    const data = await getChapterWithOverrides(hit.courseSlug, hit.chapterSlug);
    if (!data?.content) continue;
    const excerpt = makeExcerpt(data.content, q, 600);
    sources.push({
      courseSlug: hit.courseSlug,
      courseTitle: hit.courseTitle,
      chapterSlug: hit.chapterSlug,
      chapterTitle: hit.chapterTitle,
      score: hit.score,
      excerpt,
    });
    contextParts.push(`[${hit.courseTitle} / ${hit.chapterTitle}]\n${excerpt}`);
  }
  const systemPrompt = `你是 ML 学习站的 AI 助教。根据下面 [参考资料] 回答用户的问题。要求:
1. 回答简洁, 用中文
2. 必须基于参考资料, 不要编造内容
3. 如果参考资料不足, 明确说"参考资料中没有提到", 并给出建议
4. 末尾用 [1][2] 这样的标记引用来源

[参考资料]
${contextParts.join("\n\n")}
[/参考资料]`;
  return { q, sources, systemPrompt };
}

/** RAG 实现 (内部使用) */
async function ragChatInternal(opts: { query: string; history?: LLMMessage[]; topK?: number }): Promise<ChatResult> {
  const q = opts.query.trim();
  if (!q) {
    return {
      answer: "(空问题)",
      sources: [],
      provider: "",
      model: "",
      query: "",
    };
  }

  const { sources, systemPrompt } = await prepareRag({ query: q, topK: opts.topK ?? 3 });
  const provider = getLLMProvider();
  const messages: LLMMessage[] = [{ role: "system", content: systemPrompt }];
  if (opts.history) messages.push(...opts.history);
  messages.push({ role: "user", content: q });

  const answer = await provider.chat(messages, { maxTokens: 800, temperature: 0.3 });

  return {
    answer,
    sources,
    provider: provider.name,
    model: provider.name,
    query: q,
  };
}

/** 流式 RAG — yield 每个 token chunk + 最后 yield sources */
export async function* ragChatStream(
  opts: { query: string; history?: LLMMessage[]; topK?: number }
): AsyncGenerator<{ type: "sources" | "chunk" | "done"; data: any }, void, void> {
  const q = opts.query.trim();
  if (!q) {
    yield { type: "done", data: { answer: "(空问题)", sources: [], provider: "", model: "", query: "" } };
    return;
  }

  const { sources, systemPrompt } = await prepareRag({ query: q, topK: opts.topK ?? 3 });
  // 先送出 sources (客户端可以马上渲染参考资料)
  yield { type: "sources", data: sources };

  const provider = getLLMProvider();
  const messages: LLMMessage[] = [{ role: "system", content: systemPrompt }];
  if (opts.history) messages.push(...opts.history);
  messages.push({ role: "user", content: q });

  let fullText = "";
  for await (const chunk of provider.streamChat(messages, { maxTokens: 800, temperature: 0.3 })) {
    fullText += chunk;
    yield { type: "chunk", data: chunk };
  }

  yield {
    type: "done",
    data: {
      provider: provider.name,
      model: provider.name,
      query: q,
      answer: fullText,
    },
  };
}
