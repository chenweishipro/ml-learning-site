// 全文搜索: SQLite FTS5 倒排索引 + 高亮
// 性能: O(log n) 全文搜索, 比内存线性搜索快 10-100x
// 高亮: 使用 SQLite 的 snippet() 函数自动包裹 <mark> 标签
import path from "path";
import Database from "better-sqlite3";
import { getAllCoursesSync, getAllCoursesWithOverrides, getChapterWithOverridesSync } from "./content-overrides";

const FTS_VERSION = 4;
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

let writableDb: Database.Database | null = null;
let cache: { at: number; db: Database.Database } | null = null;

function getDbPath(): string {
  return path.join(process.cwd(), "prisma", "dev.db");
}

async function getDb(): Promise<Database.Database> {
  if (writableDb) return writableDb;
  writableDb = new Database(getDbPath());
  writableDb.pragma("journal_mode = WAL");
  return writableDb;
}

/**
 * 初始化 FTS5 倒排索引。内容变更后需 force=true 重建。
 * 内容: 从 ChapterOverride.body 提取;标题/课程从 getAllCoursesSync 读
 */
export async function ensureFtsIndex(force = false): Promise<void> {
  const database = await getDb();
  if (!force) {
    const meta = database
      .prepare("SELECT version FROM chapter_fts_meta LIMIT 1")
      .get() as { version: number } | undefined;
    if (meta && meta.version === FTS_VERSION) return;
  }
  // 先预热 override 缓存, 确保 getChapterWithOverridesSync 能读到 override 内容
  await getAllCoursesWithOverrides();
  database.exec(`
    DROP TABLE IF EXISTS chapter_fts;
    DROP TABLE IF EXISTS chapter_fts_meta;
    CREATE VIRTUAL TABLE chapter_fts USING fts5(
      courseSlug UNINDEXED,
      courseTitle,
      chapterSlug UNINDEXED,
      chapterTitle,
      body,
      tokenize = 'unicode61'
    );
    CREATE TABLE chapter_fts_meta (version INTEGER PRIMARY KEY);
    INSERT INTO chapter_fts_meta (version) VALUES (${FTS_VERSION});
  `);
  const allCourses = getAllCoursesSync() as any[];
  const insert = database.prepare(
    "INSERT INTO chapter_fts (courseSlug, courseTitle, chapterSlug, chapterTitle, body) VALUES (?, ?, ?, ?, ?)"
  );
  const tx = database.transaction(() => {
    let inserted = 0;
    for (const c of allCourses) {
      for (const ch of c.chapters ?? []) {
        const data = getChapterWithOverridesSync(c.slug, ch.slug);
        if (!data) continue;
        const body = (data.content ?? "")
          .replace(/```[\s\S]*?```/g, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/[#*`>_\[\](){}|]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!body) continue;
        insert.run(c.slug, c.title, ch.slug, ch.title, body);
        inserted++;
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(`[FTS] indexed ${inserted} chapters (v${FTS_VERSION})`);
    }
  });
  tx();
}

interface SearchHit {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  level: string;
  duration: string;
  count: number;
  snippet: string;
  score: number;
}

function inferLevel(courseTitle: string, courseLevel?: string): string {
  if (courseLevel) return courseLevel;
  if (courseTitle.includes("入门") || courseTitle.toLowerCase().includes("beginner") || courseTitle.includes("基础")) return "beginner";
  if (courseTitle.includes("进阶") || courseTitle.includes("高级") || courseTitle.toLowerCase().includes("advanced")) return "advanced";
  return "intermediate";
}

/** 全文搜索: FTS5 bm25 + 高亮 */
export async function fulltextSearch(opts: { query: string; limit?: number; level?: string }) {
  const q = opts.query.trim();
  if (!q) return { hits: [] as SearchHit[], total: 0, query: "" };

  await ensureFtsIndex(false);
  const db = await getDb();
  const limit = Math.min(opts.limit ?? 30, 50);
  const level = opts.level ?? "all";

  // FTS5 prefix query: term* 允许前缀匹配
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { hits: [] as SearchHit[], total: 0, query: q };
  const ftsQuery = words.map((w) => `"${w.replace(/"/g, '""')}"*`).join(" ");

  const simpleSql = `
    SELECT
      courseSlug, courseTitle, chapterSlug, chapterTitle, body,
      bm25(chapter_fts) AS bm25_score,
      snippet(chapter_fts, 3, '<mark>', '</mark>', '…', 16) AS title_snippet,
      snippet(chapter_fts, 4, '<mark>', '</mark>', '…', 24) AS body_snippet
    FROM chapter_fts
    WHERE chapter_fts MATCH @q
    ORDER BY bm25(chapter_fts)
    LIMIT @limit
  `;

  let rows: any[];
  try {
    rows = db.prepare(simpleSql).all({ q: ftsQuery, limit });
  } catch (e) {
    console.error("[FTS] query failed:", e);
    return { hits: [] as SearchHit[], total: 0, query: q };
  }

  // 同时从所有课程元数据里读 level 和 duration
  const allCourses = getAllCoursesSync() as any[];
  const metaMap = new Map<string, { level: string; duration: string }>();
  for (const c of allCourses) {
    for (const ch of c.chapters ?? []) {
      metaMap.set(`${c.slug}/${ch.slug}`, {
        level: inferLevel(c.title, c.level),
        duration: ch.duration ?? "",
      });
    }
  }

  const hits: SearchHit[] = rows.map((r) => {
    const meta = metaMap.get(`${r.courseSlug}/${r.chapterSlug}`) ?? { level: "intermediate", duration: "" };
    const body: string = r.body ?? "";
    const escapedPattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const re = new RegExp(escapedPattern, "gi");
    const count = (body.match(re) || []).length;
    return {
      courseSlug: r.courseSlug,
      courseTitle: r.courseTitle,
      chapterSlug: r.chapterSlug,
      chapterTitle: r.chapterTitle,
      level: meta.level,
      duration: meta.duration,
      count,
      snippet: r.body_snippet || r.title_snippet || body.slice(0, 240),
      score: -r.bm25_score,
    };
  });

  let filtered = hits;
  if (level !== "all") filtered = filtered.filter((h) => h.level === level);
  return { hits: filtered, total: hits.length, query: q };
}

/** 给片段加 <mark> 标签 (前端渲染用) */
export function highlightSnippet(snippet: string, query: string): string {
  if (!query || !snippet) return snippet;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return snippet.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}

/** 清除缓存 (内容变更后重建索引) */
export async function clearFulltextCache() {
  cache = null;
  await ensureFtsIndex(true);
}
