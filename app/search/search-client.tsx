"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, History as HistoryIcon, Search as SearchIcon, Sparkles, Wifi, WifiOff, X } from "lucide-react";
import { SEARCH_INDEX, type SearchEntry } from "@/lib/search";
import { LEVEL_META, cn } from "@/lib/utils";
import { getHistory, isOnline, recordSearch, clearHistory } from "@/lib/offline-search";

interface FullHit {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  level: string;
  duration: string;
  count: number;
  score: number;
  snippet: string;
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

/** 离线时本地搜索 (基于 SEARCH_INDEX, 与 lib/search.searchIndex 一致) */
function offlineSearch(query: string, limit = 30): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of SEARCH_INDEX) {
    let score = 0;
    if (entry.chapterTitle.toLowerCase().includes(q)) score += 10;
    if (entry.courseTitle.toLowerCase().includes(q)) score += 5;
    if (entry.description.toLowerCase().includes(q)) score += 3;
    if (entry.tags?.some((t) => t.toLowerCase().includes(q))) score += 4;
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

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [debounced, setDebounced] = useState("");
  const [hits, setHits] = useState<FullHit[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [online, setOnline] = useState(true);
  const [history, setHistory] = useState<{ q: string; ts: number }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 检测在线状态
  useEffect(() => {
    setOnline(isOnline());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // 加载搜索历史
  useEffect(() => {
    (async () => setHistory(await getHistory()))();
  }, []);

  // 防抖
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  // 搜索: 在线 → 服务端 FTS5, 离线 → 本地 SEARCH_INDEX
  useEffect(() => {
    if (!debounced.trim()) {
      setHits([]);
      setTotal(0);
      return;
    }
    let cancelled = false;
    setSearching(true);

    const runSearch = async () => {
      if (online) {
        try {
          const r = await fetch(`/api/search/?q=${encodeURIComponent(debounced)}&limit=30&level=${level}`, { cache: "no-store" });
          const data = await r.json();
          if (cancelled) return;
          if (data.ok) {
            setHits(data.data.hits);
            setTotal(data.data.total);
            await recordSearch(debounced);
            setHistory(await getHistory());
          }
        } catch {
          // 网络失败, 退回离线
          if (cancelled) return;
          const local = offlineSearch(debounced, 30);
          setHits(
            local.map((e) => ({
              courseSlug: e.courseSlug,
              courseTitle: e.courseTitle,
              chapterSlug: e.chapterSlug,
              chapterTitle: e.chapterTitle,
              level: e.level as string,
              duration: e.duration,
              count: 0,
              score: 0,
              snippet: e.description,
            }))
          );
          setTotal(local.length);
        }
      } else {
        // 离线
        if (cancelled) return;
        const local = offlineSearch(debounced, 30);
        setHits(
          local.map((e) => ({
            courseSlug: e.courseSlug,
            courseTitle: e.courseTitle,
            chapterSlug: e.chapterSlug,
            chapterTitle: e.chapterTitle,
            level: e.level as string,
            duration: e.duration,
            count: 0,
            score: 0,
            snippet: e.description,
          }))
        );
        setTotal(local.length);
        await recordSearch(debounced);
        setHistory(await getHistory());
      }
      if (!cancelled) setSearching(false);
    };

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [debounced, level, online]);

  const popular = useMemo(() => SEARCH_INDEX.slice(0, 6), []);

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          🔍 搜索课程
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {debounced
            ? <>找到 {total} 个章节, 显示 {hits.length} 个</>
            : <>在 {SEARCH_INDEX.length} 个章节中搜索</>}
        </p>
      </header>

      {/* 离线 / 在线状态 */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
            online
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50"
              : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50"
          )}
        >
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? "在线 · 全文搜索" : "离线 · 仅本地标题/描述搜索"}
        </span>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            <HistoryIcon className="h-3 w-3" />
            历史 ({history.length})
          </button>
        )}
      </div>

      {/* 历史下拉 */}
      {showHistory && history.length > 0 && (
        <div className="mx-auto mb-4 max-w-2xl rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
            <span>最近搜索</span>
            <button onClick={handleClearHistory} className="text-[10px] text-neutral-400 hover:text-red-500">
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h) => (
              <button
                key={h.q + h.ts}
                onClick={() => {
                  setQuery(h.q);
                  setShowHistory(false);
                }}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {h.q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索框 */}
      <div className="relative mx-auto max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={online ? "输入关键字, 如 “线性回归”、“梯度下降”..." : "离线模式 · 搜索标题/描述"}
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
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
          <div className="flex flex-wrap justify-center gap-2">
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
              {popular.map((entry: SearchEntry) => {
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
          {hits.length === 0 && !searching ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                没有找到 “<span className="font-mono">{debounced}</span>” 相关的内容。
              </p>
              <p className="mt-2 text-xs text-neutral-400">试试其它关键字, 或浏览上面推荐的关键字。</p>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                {searching ? "搜索中..." : <>找到 <strong className="text-neutral-900 dark:text-neutral-100">{hits.length}</strong> 个结果</>}
              </div>
              <ul className="space-y-3">
                {hits.map((h) => (
                  <li key={`${h.courseSlug}/${h.chapterSlug}`}>
                    <SearchResultCard hit={h} query={debounced} />
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
        {hit.duration && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
            <Clock className="h-3 w-3" />
            {hit.duration}
          </div>
        )}
        <p
          className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 [&_mark]:rounded [&_mark]:bg-yellow-100 [&_mark]:px-0.5 [&_mark]:text-neutral-900 dark:[&_mark]:bg-yellow-900/40 dark:[&_mark]:text-yellow-200"
          dangerouslySetInnerHTML={{ __html: hit.snippet }}
        />
      </div>
      <ArrowRight className="mt-3 h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
    </Link>
  );
}
