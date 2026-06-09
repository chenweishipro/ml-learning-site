// 全文搜索: 搜章节正文, 返回带高亮片段
import { promises as fs } from "fs";
import path from "path";
import { getAllCoursesSync, getChapterWithOverrides } from "./content-overrides";

interface IndexedChapter {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  body: string;
  description: string;
  level: string;
  duration: string;
}

interface SearchHit {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  level: string;
  duration: string;
  /** 命中次数 */
  count: number;
  /** 包含匹配片段 (高亮用) */
  snippet: string;
  /** 相关度分数 */
  score: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 分钟
let cache: { at: number; entries: IndexedChapter[] } | null = null;

async function buildIndex(): Promise<IndexedChapter[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return cache.entries;
  }
  const all = getAllCoursesSync() as any[];
  const entries: IndexedChapter[] = [];
  for (const c of all) {
    for (const ch of c.chapters ?? []) {
      const data = await getChapterWithOverrides(c.slug, ch.slug);
      if (!data) continue;
      // 移除 MDX 语法符号, 保留纯文本做搜索
      const text = (data.content || "")
        .replace(/```[\s\S]*?```/g, " ") // 代码块
        .replace(/<[^>]+>/g, " ")        // 标签
        .replace(/[#*`>_\[\](){}|]/g, " ") // MDX 符号
        .replace(/\s+/g, " ")
        .trim();
      entries.push({
        courseSlug: c.slug,
        courseTitle: c.title,
        chapterSlug: ch.slug,
        chapterTitle: ch.title,
        body: text,
        description: ch.description ?? "",
        level: c.level,
        duration: ch.duration ?? "",
      });
    }
  }
  cache = { at: Date.now(), entries };
  return entries;
}

function makeSnippet(body: string, query: string, contextLen = 80, maxLen = 240): string {
  if (!body || !query) return body.slice(0, maxLen);
  const lower = body.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lower.indexOf(lowerQuery);
  if (idx < 0) return body.slice(0, maxLen) + (body.length > maxLen ? "..." : "");
  const start = Math.max(0, idx - contextLen);
  const end = Math.min(body.length, idx + query.length + contextLen);
  let snippet = body.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < body.length) snippet = snippet + "...";
  if (snippet.length > maxLen + 20) snippet = snippet.slice(0, maxLen) + "...";
  return snippet;
}

function highlight(snippet: string, query: string): string {
  if (!query) return snippet;
  // 用简单的不区分大小写替换, 包 <mark> 标签
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return snippet.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}

/** 全文搜索章节正文 */
export async function fulltextSearch(opts: { query: string; limit?: number; level?: string }) {
  const q = opts.query.trim();
  if (!q) return { hits: [] as SearchHit[], total: 0, query: "" };

  const entries = await buildIndex();
  const hits: SearchHit[] = [];

  const lowerQ = q.toLowerCase();
  const words = lowerQ.split(/\s+/).filter(Boolean);

  for (const e of entries) {
    const body = e.body;
    const lower = body.toLowerCase();
    let count = 0;
    for (const w of words) {
      // 简单: 出现次数
      let pos = 0;
      while ((pos = lower.indexOf(w, pos)) !== -1) {
        count++;
        pos += w.length;
      }
    }
    if (count === 0) continue;

    // 评分: 完整查询命中次数 + 标题命中 + 描述命中
    let score = count;
    if (e.chapterTitle.toLowerCase().includes(lowerQ)) score += 20;
    if (e.description.toLowerCase().includes(lowerQ)) score += 10;

    hits.push({
      courseSlug: e.courseSlug,
      courseTitle: e.courseTitle,
      chapterSlug: e.chapterSlug,
      chapterTitle: e.chapterTitle,
      level: e.level,
      duration: e.duration,
      count,
      score,
      snippet: makeSnippet(body, lowerQ),
    });
  }

  // 过滤级别
  let filtered = hits;
  if (opts.level && opts.level !== "all") {
    filtered = filtered.filter((h) => h.level === opts.level);
  }
  filtered.sort((a, b) => b.score - a.score);
  const result = filtered.slice(0, opts.limit ?? 30);
  return { hits: result, total: hits.length, query: q };
}

/** 给片段加 <mark> 标签 (前端 dangerouslySetInnerHTML 用) */
export function highlightSnippet(snippet: string, query: string): string {
  return highlight(snippet, query);
}

/** 清除缓存 (开发时用) */
export function clearFulltextCache() {
  cache = null;
}
