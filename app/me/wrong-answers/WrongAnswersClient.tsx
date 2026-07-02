"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Check, ChevronDown, ChevronUp, Loader2, Sparkles, Trash2, X, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface WrongItem {
  id: string;
  resolved: boolean;
  questionIndex: number;
  updatedAt: string;
  course: { slug: string; title: string };
  chapter: { slug: string; title: string };
  question: {
    text: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    explanation?: string;
  };
}

export function WrongAnswersClient({ items: initial }: { items: WrongItem[] }) {
  const [items, setItems] = useState<WrongItem[]>(initial);
  const [filter, setFilter] = useState<"unresolved" | "resolved" | "all">("unresolved");
  const [busy, setBusy] = useState<string | "all" | null>(null);
  const [explainOpen, setExplainOpen] = useState<string | null>(null);
  const [explainCache, setExplainCache] = useState<Record<string, { text: string; model?: string; cached?: boolean; loading?: boolean }>>({});

  const filtered = items.filter((i) =>
    filter === "all" ? true : filter === "resolved" ? i.resolved : !i.resolved
  );

  const markResolved = async (ids: string[]) => {
    setBusy("all");
    try {
      const res = await fetch("/api/quiz/wrong", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((it) => (ids.includes(it.id) ? { ...it, resolved: true } : it)));
      }
    } finally {
      setBusy(null);
    }
  };

  const markAll = async () => {
    if (!confirm("确认将所有未掌握的错题标为已会?")) return;
    setBusy("all");
    try {
      const res = await fetch("/api/quiz/wrong", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((it) => ({ ...it, resolved: true })));
      }
    } finally {
      setBusy(null);
    }
  };

  async function askAI(item: WrongItem) {
    if (explainOpen === item.id) {
      setExplainOpen(null);
      return;
    }
    setExplainOpen(item.id);
    if (explainCache[item.id]?.text) return;
    // 加载
    setExplainCache((m) => ({ ...m, [item.id]: { text: "", loading: true } }));
    try {
      const r = await fetch("/api/quiz/explain", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: item.course.slug,
          chapterSlug: item.chapter.slug,
          questionIndex: item.questionIndex,
          userAnswer: item.question.userAnswer,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setExplainCache((m) => ({
          ...m,
          [item.id]: { text: d.explanation, model: d.model, cached: d.cached, loading: false },
        }));
      } else {
        setExplainCache((m) => ({ ...m, [item.id]: { text: `生成失败: ${d.error ?? "未知错误"}`, loading: false } }));
      }
    } catch (e: any) {
      setExplainCache((m) => ({ ...m, [item.id]: { text: `网络错误: ${e?.message ?? "?"}`, loading: false } }));
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <BookOpen className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700" />
        <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">错题本是空的</h3>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          去做 <Link href="/courses/" className="text-primary-700 hover:underline">章节测验</Link>, 答错的题会自动收集在这里。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          {(["unresolved", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition",
                filter === f
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              {f === "unresolved" ? "未掌握" : f === "resolved" ? "已掌握" : "全部"} ({items.filter((i) =>
                f === "all" ? true : f === "resolved" ? i.resolved : !i.resolved
              ).length})
            </button>
          ))}
        </div>
        {filter !== "resolved" && filtered.some((i) => !i.resolved) && (
          <Button onClick={markAll} disabled={busy === "all"} size="sm" variant="secondary">
            {busy === "all" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            全部标为已会
          </Button>
        )}
      </div>

      <ul className="space-y-4">
        {filtered.map((item) => (
          <WrongItemCard
            key={item.id}
            item={item}
            onMarkResolved={() => markResolved([item.id])}
            busy={busy === item.id}
            askAI={() => askAI(item)}
            aiOpen={explainOpen === item.id}
            aiState={explainCache[item.id]}
          />
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            当前筛选下没有题目。
          </p>
        </div>
      )}
    </>
  );
}

function WrongItemCard({
  item,
  onMarkResolved,
  busy,
  askAI,
  aiOpen,
  aiState,
}: {
  item: WrongItem;
  onMarkResolved: () => void;
  busy: boolean;
  askAI: () => void;
  aiOpen: boolean;
  aiState?: { text: string; model?: string; cached?: boolean; loading?: boolean };
}) {
  return (
    <li>
      <Card className={cn(item.resolved && "opacity-60")}>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Link
              href={`/courses/${item.course.slug}/`}
              className="font-medium text-primary-700 hover:underline dark:text-primary-300"
            >
              {item.course.title}
            </Link>
            <span>/</span>
            <Link
              href={`/courses/${item.course.slug}/${item.chapter.slug}/`}
              className="hover:underline"
            >
              {item.chapter.title}
            </Link>
            <span className="ml-1 text-[10px] text-neutral-400">#{item.questionIndex + 1}</span>
            {item.resolved && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
                <Check className="h-3 w-3" /> 已掌握
              </span>
            )}
          </div>
          <CardTitle className="mt-2 text-base">{item.question.text}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {item.question.options.map((opt, i) => {
              const isUserAnswer = i === item.question.userAnswer;
              const isCorrect = i === item.question.correctAnswer;
              return (
                <li
                  key={i}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-200"
                      : isUserAnswer
                      ? "border-rose-200 bg-rose-50/60 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/20 dark:text-rose-200"
                      : "border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      "mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full text-[10px] font-bold",
                      isCorrect ? "bg-emerald-500 text-white" : isUserAnswer ? "bg-rose-500 text-white" : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                    )}>
                      {isCorrect ? <Check className="h-2.5 w-2.5" /> : isUserAnswer ? <X className="h-2.5 w-2.5" /> : ["A", "B", "C", "D"][i]}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isUserAnswer && !isCorrect && <span className="text-[10px] text-rose-600 dark:text-rose-400">你的选择</span>}
                    {isCorrect && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">正确答案</span>}
                  </div>
                </li>
              );
            })}
          </ul>

          {item.question.explanation && (
            <div className="mt-3 rounded-md border-l-2 border-primary-300 bg-primary-50/40 px-3 py-2 text-xs text-neutral-700 dark:border-primary-700 dark:bg-primary-950/20 dark:text-neutral-300">
              <strong className="text-primary-700 dark:text-primary-300">原题解析:</strong> {item.question.explanation}
            </div>
          )}

          {/* AI 讲解 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={aiOpen ? "primary" : "outline"}
              onClick={askAI}
              disabled={aiState?.loading}
              className="inline-flex items-center gap-1.5"
            >
              {aiState?.loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI 讲解
              {aiOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkResolved}
              disabled={busy || item.resolved}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {item.resolved ? "已掌握" : "标为已会"}
            </Button>
          </div>

          {aiOpen && (
            <div className="mt-3 rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/30 p-3 dark:border-violet-800/40 dark:from-violet-950/20 dark:to-fuchsia-950/20">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                <Bot className="h-3 w-3" />
                AI 讲解
                {aiState?.model && <span className="ml-auto text-[9px] font-normal text-violet-500/80">via {aiState.model}{aiState.cached ? " · cached" : ""}</span>}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                {aiState?.loading ? "AI 正在结合章节内容生成讲解..." : aiState?.text || "等待中..."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
