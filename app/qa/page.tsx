"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Tag,
  ThumbsUp,
  TrendingUp,
  Eye,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

interface Question {
  id: string;
  title: string;
  body: string;
  courseSlug: string | null;
  chapterSlug: string | null;
  tags: string;
  status: string;
  answerCount: number;
  viewCount: number;
  voteCount: number;
  createdAt: string;
  author: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
  };
}

type SortKey = "newest" | "votes" | "answers" | "views";
type StatusFilter = "all" | "open" | "answered";

export default function QAListPage() {
  const { user, ready } = useAuth();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [tag, setTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: "50" });
      if (status !== "all") params.set("status", status);
      if (tag) params.set("tag", tag);
      const res = await fetch(`/api/questions/?${params}`);
      const data = await res.json();
      if (data.ok) setQuestions(data.data.questions);
    } finally {
      setLoading(false);
    }
  }, [sort, status, tag]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!questions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (x) => x.title.toLowerCase().includes(q) || x.body.toLowerCase().includes(q) || x.tags.toLowerCase().includes(q)
    );
  }, [questions, search]);

  const popularTags = useMemo(() => {
    if (!questions) return [];
    const counts = new Map<string, number>();
    for (const q of questions) {
      for (const t of q.tags.split(",").map((s) => s.trim()).filter(Boolean)) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [questions]);

  return (
    <div className="container py-10 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
            <MessageCircle className="h-3 w-3" />
            问答社区
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">提问 · 解答</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            卡在哪里? 提个问, 社区 + AI 帮你解答。
          </p>
        </div>
        {ready && user && (
          <button
            onClick={() => router.push("/qa/new/")}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            提问
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索问题..."
            className="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
        </div>
        <div className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
          {(
            [
              { v: "all", label: "全部" },
              { v: "open", label: "待解答" },
              { v: "answered", label: "已解答" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.v}
              onClick={() => setStatus(tab.v)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition",
                status === tab.v
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:text-primary-700 dark:text-neutral-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="newest">最新</option>
          <option value="votes">高分</option>
          <option value="answers">多答</option>
          <option value="views">热门</option>
        </select>
      </div>

      {popularTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <Tag className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-[11px] text-neutral-500">热门标签:</span>
          {popularTags.map(([t, c]) => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? null : t)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium transition",
                tag === t
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              )}
            >
              #{t} <span className="opacity-60">({c})</span>
            </button>
          ))}
        </div>
      )}

      {loading || !questions ? (
        <div className="flex items-center justify-center py-10 text-sm text-neutral-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {search || tag ? "没有匹配问题" : "还没有问题, 来提第一个吧!"}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((q) => (
            <li key={q.id}>
              <Link
                href={`/qa/${q.id}/`}
                className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700 sm:flex-row sm:items-center"
              >
                {/* 左侧统计 */}
                <div className="flex w-24 flex-shrink-0 items-center justify-around text-xs sm:flex-col sm:items-end sm:gap-1">
                  <span className={cn("inline-flex items-center gap-1 tabular-nums", q.status === "answered" ? "text-emerald-700 dark:text-emerald-400" : "text-neutral-500")}>
                    {q.status === "answered" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <MessageSquare className="h-3 w-3" />
                    )}
                    {q.answerCount} 答
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums text-neutral-500">
                    <ThumbsUp className="h-3 w-3" />
                    {q.voteCount}
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums text-neutral-400">
                    <Eye className="h-3 w-3" />
                    {q.viewCount}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                    {q.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {q.body.replace(/[#*`>]/g, "").slice(0, 100)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                    {q.tags.split(",").filter(Boolean).slice(0, 4).map((t) => (
                      <span key={t} className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                        #{t.trim()}
                      </span>
                    ))}
                    <span>{q.author.displayName || q.author.email}</span>
                    <span>·</span>
                    <span>
                      {new Date(q.createdAt).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {q.courseSlug && (
                      <>
                        <span>·</span>
                        <span className="rounded bg-primary-50 px-1.5 py-0.5 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400">
                          {q.courseSlug}
                          {q.chapterSlug && ` / ${q.chapterSlug}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="hidden h-4 w-4 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-500 sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
