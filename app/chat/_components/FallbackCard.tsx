"use client";

/** v20.4 RAG 召回失败兜底 — 所有 sources score < 0.3 时显示 */
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";

export interface FallbackCardProps {
  query?: string; // 用户问题 (用于搜索跳转)
}

export function FallbackCard({ query }: FallbackCardProps) {
  const searchHref = query
    ? `/search/?q=${encodeURIComponent(query.slice(0, 50))}`
    : "/search/";
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        <BookOpen className="h-3.5 w-3.5" />
        没找到满意的答案?
      </div>
      <p className="mb-2 text-[11px] text-amber-700/80 dark:text-amber-300/80">
        AI 没找到强相关的章节。试试:
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <Link
          href={searchHref}
          className="inline-flex items-center justify-between gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:bg-neutral-900 dark:text-amber-200 dark:hover:bg-amber-950/50"
        >
          <span className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            全站搜索
          </span>
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/courses/"
          className="inline-flex items-center justify-between gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:bg-neutral-900 dark:text-amber-200 dark:hover:bg-amber-950/50"
        >
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            浏览课程目录
          </span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
