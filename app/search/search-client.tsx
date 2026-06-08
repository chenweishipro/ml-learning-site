"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Search as SearchIcon, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { searchIndex, SEARCH_INDEX, type SearchEntry } from "@/lib/search";
import { LEVEL_META, cn } from "@/lib/utils";

const SUGGESTIONS = [
  "线性回归",
  "梯度下降",
  "过拟合",
  "神经网络",
  "反向传播",
  "决策树",
  "SVM",
  "激活函数",
];

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [debounced, setDebounced] = useState("");

  // 防抖, 减少不必要的过滤
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    if (!debounced.trim()) return [];
    let res = searchIndex(debounced, 50);
    if (level !== "all") {
      res = res.filter((r) => r.level === level);
    }
    return res;
  }, [debounced, level]);

  // 按课程分组, 方便快速看
  const grouped = useMemo(() => {
    const map = new Map<string, SearchEntry[]>();
    for (const r of results) {
      const list = map.get(r.courseTitle) ?? [];
      list.push(r);
      map.set(r.courseTitle, list);
    }
    return Array.from(map.entries());
  }, [results]);

  const popular = useMemo(() => {
    // 显示前 6 个作为"热门推荐"
    return SEARCH_INDEX.slice(0, 6);
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          🔍 搜索课程
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          在 {SEARCH_INDEX.length} 个章节中搜索
        </p>
      </header>

      {/* 搜索框 */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键字, 如 “线性回归”、“梯度下降”..."
          className="w-full rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 py-3.5 pl-12 pr-12 text-base shadow-soft transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-primary-700 dark:focus:ring-primary-900"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="清除"
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 难度筛选 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">难度:</span>
        {(["all", "beginner", "intermediate", "advanced"] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => setLevel(lv)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              level === lv
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            )}
          >
            {lv === "all" ? "全部" : LEVEL_META[lv].label}
          </button>
        ))}
      </div>

      {/* 热门推荐 (无查询时) */}
      {!debounced.trim() && (
        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Sparkles className="h-4 w-4" />
            <span>试试这些关键字</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full border border-neutral-200 bg-white dark:bg-neutral-900 px-3.5 py-1.5 text-sm text-neutral-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">所有章节</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {popular.map((entry) => (
                <SearchResultCard key={entry.key} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {debounced.trim() && (
        <div className="mt-8">
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white dark:bg-neutral-900 p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                没有找到 “<span className="font-mono">{debounced}</span>” 相关的内容。
              </p>
              <p className="mt-2 text-xs text-neutral-400">试试其它关键字, 或浏览上面推荐的关键字。</p>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                找到 <strong className="text-neutral-900 dark:text-neutral-100">{results.length}</strong> 个结果
              </div>
              {grouped.map(([courseTitle, entries]) => (
                <div key={courseTitle} className="mb-8">
                  <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {courseTitle} <span className="text-xs font-normal text-neutral-500">({entries.length})</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {entries.map((entry) => (
                      <SearchResultCard key={entry.key} entry={entry} query={debounced} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ entry, query }: { entry: SearchEntry; query?: string }) {
  return (
    <Link href={`/courses/${entry.courseSlug}/${entry.chapterSlug}`} className="group block">
      <Card hoverable className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="primary" className="text-[10px]">
            {entry.courseTitle}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {entry.duration}
            </span>
          </div>
        </div>
        <h4 className="mt-2 line-clamp-2 text-sm font-semibold text-neutral-900 transition group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
          {highlight(entry.chapterTitle, query)}
        </h4>
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
          {highlight(entry.description, query)}
        </p>
        <div className="mt-3 flex items-center gap-1 text-xs text-primary-600 opacity-0 transition group-hover:opacity-100 dark:text-primary-300">
          <BookOpen className="h-3 w-3" />
          <span>打开章节</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </Card>
    </Link>
  );
}

/** 简单高亮命中关键字 */
function highlight(text: string, query?: string) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-100 px-0.5 text-neutral-900 dark:bg-yellow-900/40 dark:text-yellow-200">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
