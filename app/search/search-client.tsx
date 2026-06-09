"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Search as SearchIcon, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { searchIndex, SEARCH_INDEX, type SearchEntry } from "@/lib/search";
import { highlightSnippet } from "@/lib/fulltext-search";
import { LEVEL_META, cn } from "@/lib/utils";

interface FullHit {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  level: string;
  duration: string;
  count: number;
  score: number;
  snippet: string; // 含 <mark>
}

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

  const [hits, setHits] = useState<FullHit[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState<"fulltext" | "semantic">("fulltext");
  const [semanticResults, setSemanticResults] = useState<FullHit[]>([]);
  const [semanticTotal, setSemanticTotal] = useState(0);
  const [providerName, setProviderName] = useState("");

  useEffect(() => {
    if (!debounced.trim()) {
      setHits([]);
      setTotal(0);
      setSemanticResults([]);
      setSemanticTotal(0);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const endpoint = mode === "semantic" ? "/api/semantic/" : "/api/search/";
    fetch(`${endpoint}?q=${encodeURIComponent(debounced)}&limit=30&level=${level}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          if (mode === "semantic") {
            setSemanticResults(data.data.hits);
            setSemanticTotal(data.data.total);
            setProviderName(data.data.provider ?? "");
            setHits([]);
            setTotal(0);
          } else {
            setHits(data.data.hits);
            setTotal(data.data.total);
            setSemanticResults([]);
            setSemanticTotal(0);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, level, mode]);

  const results = mode === "semantic" ? semanticResults : hits;

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
          {debounced
            ? mode === "semantic"
              ? <>🧠 语义搜索: {semanticTotal} 个相关章节, 显示 {semanticResults.length} 个</>
              : <>找到 {total} 个章节, 显示 {hits.length} 个</>
            : <>在 {SEARCH_INDEX.length} 个章节中搜索</>}
        </p>
      </header>

      {/* 搜索框 */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-neutral-500">搜索方式:</span>
        <div className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
          {([
            { v: "fulltext", label: "🔍 关键词" },
            { v: "semantic", label: "🧠 AI 语义" },
          ] as const).map((tab) => (
            <button
              key={tab.v}
              onClick={() => setMode(tab.v)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition",
                mode === tab.v
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:text-primary-700 dark:text-neutral-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {mode === "semantic" && providerName && (
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:ring-purple-800/50">
            provider: {providerName}
          </span>
        )}
      </div>

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
              {popular.map((entry) => {
                // 把 SearchEntry 适配到 FullHit
                const hit: FullHit = {
                  courseSlug: entry.courseSlug,
                  courseTitle: entry.courseTitle,
                  chapterSlug: entry.chapterSlug,
                  chapterTitle: entry.chapterTitle,
                  level: entry.level as string,
                  duration: entry.duration,
                  count: 0,
                  score: 0,
                  snippet: entry.description,
                };
                return <SearchResultCard key={entry.key} hit={hit} />;
              })}
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
              <ul className="space-y-3">
                {hits.map((h) => (
                  <li key={`${h.courseSlug}/${h.chapterSlug}`}>
                    <SearchResultCard
                      hit={h}
                      query={debounced}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ hit, query }: { hit: FullHit; query?: string }) {
  return (
    <Link href={`/courses/${hit.courseSlug}/${hit.chapterSlug}/`} className="group flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
        <BookOpen className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50">
            {hit.chapterTitle}
          </h3>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {hit.courseTitle}
          </span>
          {hit.count > 0 ? (
            <span className="text-[10px] text-neutral-400">
              {hit.count} 处命中
            </span>
          ) : hit.score > 0 ? (
            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
              {(hit.score * 100).toFixed(0)}% 相似
            </span>
          ) : null}
        </div>
        <p
          className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
          dangerouslySetInnerHTML={{ __html: hit.snippet }}
        />
      </div>
      <ArrowRight className="mt-3 h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
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
