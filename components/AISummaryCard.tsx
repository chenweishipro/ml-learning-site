"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISummaryCardProps {
  courseSlug: string;
  chapterSlug: string;
  initial?: string | null;
}

export function AISummaryCard({ courseSlug, chapterSlug, initial }: AISummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(!!initial);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/summary?course=${courseSlug}&chapter=${chapterSlug}`);
      const data = await res.json();
      if (data.ok && data.data.summary) {
        setSummary(data.data.summary);
        setOpen(true);
      } else {
        setError(data.error ?? "AI 摘要暂不可用");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/40 via-white to-accent-50/30 ring-1 ring-primary-100 dark:border-primary-800/50 dark:from-primary-950/20 dark:via-neutral-900 dark:to-accent-950/20 dark:ring-primary-900/30">
      <button
        onClick={() => {
          if (!summary && !loading) fetchSummary();
          else setOpen((v) => !v);
        }}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-primary-50/30 dark:hover:bg-primary-950/20"
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            AI 摘要
          </span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500" />}
        </div>
        {summary && (
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        )}
      </button>
      {open && (
        <div className="border-t border-primary-100/60 px-4 py-3 dark:border-primary-900/40">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AI 正在阅读本章并生成摘要…
            </div>
          )}
          {error && !loading && (
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          {summary && !loading && (
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
