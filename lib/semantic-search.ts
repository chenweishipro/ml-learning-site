// 语义搜索: 用 embedding 算余弦相似度
// 与 fulltext 互补: fulltext 看字面, semantic 看语义
import { getAllCoursesSync, getChapterWithOverrides } from "./content-overrides";
import { getEmbeddingProvider, cosine, type EmbeddingProvider } from "./embedding";

interface IndexedChapter {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  body: string;
  description: string;
  level: string;
  duration: string;
  /** 缓存的向量 (懒加载) */
  vector: number[];
}

const CACHE_TTL = 60 * 1000;
let cache: { at: number; providerName: string; entries: IndexedChapter[] } | null = null;

async function buildIndex(provider: EmbeddingProvider): Promise<IndexedChapter[]> {
  if (
    cache &&
    Date.now() - cache.at < CACHE_TTL &&
    cache.providerName === provider.name
  ) {
    return cache.entries;
  }
  const all = getAllCoursesSync() as any[];
  const entries: IndexedChapter[] = [];
  for (const c of all) {
    for (const ch of c.chapters ?? []) {
      const data = await getChapterWithOverrides(c.slug, ch.slug);
      if (!data) continue;
      const text = (data.content || "")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/[#*`>_\[\](){}|]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000); // 限长, 避免 embed 太大
      const title = ch.title ?? "";
      const desc = ch.description ?? "";
      // 标题 + 描述 + 正文首段 (标题重复 5 次, 描述重复 2 次, 让标题在 hash 空间里占更多 density)
      const titleBoost = `${title} `.repeat(5).trim();
      const descBoost = `${desc} `.repeat(2).trim();
      const toEmbed = `${titleBoost} ${descBoost} ${text}`;
      const vector = await provider.embed(toEmbed);
      entries.push({
        courseSlug: c.slug,
        courseTitle: c.title,
        chapterSlug: ch.slug,
        chapterTitle: ch.title,
        body: text,
        description: desc,
        level: c.level,
        duration: ch.duration ?? "",
        vector,
      });
    }
  }
  cache = { at: Date.now(), providerName: provider.name, entries };
  return entries;
}

export interface SemanticHit {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  level: string;
  duration: string;
  /** 相似度 0..1 */
  score: number;
  /** 命中片段 (高亮用) */
  snippet: string;
}

function makeSnippet(body: string, query: string, contextLen = 80, maxLen = 240): string {
  if (!body || !query) return body.slice(0, maxLen);
  const lower = body.toLowerCase();
  const lowerQuery = query.toLowerCase();
  // 尝试命中关键词
  const words = lowerQuery.split(/\s+/).filter(Boolean);
  let idx = -1;
  for (const w of words) {
    const found = lower.indexOf(w);
    if (found >= 0) {
      idx = found;
      break;
    }
  }
  if (idx < 0) {
    // 关键词都没命中, 取首段
    return body.slice(0, maxLen) + (body.length > maxLen ? "..." : "");
  }
  const start = Math.max(0, idx - contextLen);
  const end = Math.min(body.length, idx + words[0].length + contextLen);
  let snippet = body.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < body.length) snippet = snippet + "...";
  return snippet;
}

function highlight(snippet: string, query: string): string {
  if (!query) return snippet;
  const words = query.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return snippet;
  const pattern = new RegExp(`(${words.join("|")})`, "gi");
  return snippet.replace(pattern, "<mark>$1</mark>");
}

export async function semanticSearch(opts: { query: string; limit?: number; level?: string }) {
  const q = opts.query.trim();
  if (!q) return { hits: [] as SemanticHit[], total: 0, query: "", provider: "" };
  const provider = getEmbeddingProvider();
  const entries = await buildIndex(provider);
  const qvec = await provider.embed(q);

  const scored = entries.map((e) => {
    const sim = cosine(qvec, e.vector);
    // v19.8.3 keyword boost: 如果 query 中途的核心词出现在 chapter title 或描述里, 加 0.5 (emu back)
    // 这是在 mock-tfidf embedding 召回不够时的兑底机制
    const queryWords = q.split(/\s+/).filter((w) => w.length >= 2);
    let keywordBoost = 0;
    for (const w of queryWords) {
      // 双向匹配: query 词在 title, 或 query 词 同时出现在 title 里的子串
      if (e.chapterTitle.includes(w)) keywordBoost = Math.max(keywordBoost, 0.5);
      else if (e.description && e.description.includes(w)) keywordBoost = Math.max(keywordBoost, 0.2);
    }
    // 扩展: query 中途的多字词 (>=3) 子串在 title 里出现 (正面 boost)
    for (const w of queryWords) {
      if (w.length >= 3 && e.chapterTitle.includes(w.substring(0, Math.max(2, w.length - 1)))) {
        keywordBoost = Math.max(keywordBoost, 0.3);
      }
    }
    return { entry: e, score: sim + keywordBoost };
  });
  // 过滤
  let filtered = scored;
  if (opts.level && opts.level !== "all") {
    filtered = filtered.filter((s) => s.entry.level === opts.level);
  }
  filtered.sort((a, b) => b.score - a.score);
  const result = filtered.slice(0, opts.limit ?? 20);

  const hits: SemanticHit[] = result.map((s) => ({
    courseSlug: s.entry.courseSlug,
    courseTitle: s.entry.courseTitle,
    chapterSlug: s.entry.chapterSlug,
    chapterTitle: s.entry.chapterTitle,
    level: s.entry.level,
    duration: s.entry.duration,
    score: s.score,
    snippet: makeSnippet(s.entry.body, q),
  }));

  return {
    hits,
    total: hits.length,
    query: q,
    provider: provider.name,
  };
}

export function highlightSemanticSnippet(snippet: string, query: string): string {
  return highlight(snippet, query);
}

export function clearSemanticCache() {
  cache = null;
}
