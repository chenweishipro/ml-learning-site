import { courses, type CourseMeta, type ChapterMeta } from "@/content/courses/_index";

/**
 * 搜索索引条目
 */
export interface SearchEntry {
  /** 唯一 key, 例如 "ml-basics/what-is-ml" */
  key: string;
  /** 课程 slug */
  courseSlug: string;
  /** 课程标题 */
  courseTitle: string;
  /** 章节 slug */
  chapterSlug: string;
  /** 章节标题 */
  chapterTitle: string;
  /** 章节描述 */
  description: string;
  /** 难度 */
  level: CourseMeta["level"];
  /** 课程标签 */
  tags?: string[];
  /** 章节时长 */
  duration: string;
  /** 课程封面 (渐变色) */
  coverColor: string;
}

/**
 * 课程封面渐变色映射 (与 CoursePreview 卡片一致)
 */
const COVER_COLORS: Record<string, string> = {
  "ml-basics": "from-primary-500 to-accent-500",
  "supervised-learning": "from-accent-500 to-primary-600",
  "neural-networks": "from-primary-600 to-purple-600",
  "deep-learning-advanced": "from-purple-600 to-pink-500",
  "reinforcement-learning": "from-amber-500 to-primary-500",
};

/**
 * 客户端搜索索引(纯 JS 可用)
 * - 列出所有章节, 不含正文(减少体积)
 * - 搜索时按标题/描述/课程名/标签做简单子串匹配
 */
export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const c of courses) {
    for (const ch of c.chapters) {
      entries.push({
        key: `${c.slug}/${ch.slug}`,
        courseSlug: c.slug,
        courseTitle: c.title,
        chapterSlug: ch.slug,
        chapterTitle: ch.title,
        description: ch.description,
        level: c.level,
        tags: c.tags,
        duration: ch.duration,
        coverColor: COVER_COLORS[c.slug] ?? "from-primary-500 to-accent-500",
      });
    }
  }
  return entries;
}

export const SEARCH_INDEX = buildSearchIndex();

/**
 * 简单打分搜索: 标题命中 > 描述命中 > 标签命中
 */
export function searchIndex(query: string, limit = 20): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of SEARCH_INDEX) {
    let score = 0;
    if (entry.chapterTitle.toLowerCase().includes(q)) score += 10;
    if (entry.courseTitle.toLowerCase().includes(q)) score += 5;
    if (entry.description.toLowerCase().includes(q)) score += 3;
    if (entry.tags?.some((t) => t.toLowerCase().includes(q))) score += 4;
    // 也支持多个关键词
    const words = q.split(/\s+/);
    if (words.length > 1) {
      let wordHits = 0;
      for (const w of words) {
        if (entry.chapterTitle.toLowerCase().includes(w)) wordHits += 2;
        if (entry.description.toLowerCase().includes(w)) wordHits += 1;
      }
      score += wordHits;
    }
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
