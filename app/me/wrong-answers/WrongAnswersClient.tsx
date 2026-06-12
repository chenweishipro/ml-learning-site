"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, RotateCcw, Trash2, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface WrongItem {
  id: string;
  resolved: boolean;
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

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <BookOpen className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700" />
        <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">错题本是空的</h3>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          去做 <Link href="/courses" className="text-primary-700 hover:underline">章节测验</Link>, 答错的题会自动收集在这里。
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 工具栏 */}
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
          <Button
            onClick={markAll}
            disabled={busy === "all"}
            size="sm"
            variant="secondary"
          >
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
}: {
  item: WrongItem;
  onMarkResolved: () => void;
  busy: boolean;
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
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                    isCorrect
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-200"
                      : isUserAnswer
                      ? "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/20 dark:text-red-200"
                      : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                  )}
                >
                  {isCorrect ? (
                    <Check className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  ) : isUserAnswer ? (
                    <X className="h-4 w-4 flex-shrink-0 text-red-600" />
                  ) : (
                    <span className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="flex-1">{opt}</span>
                  {isUserAnswer && !isCorrect && (
                    <span className="text-xs text-red-600 dark:text-red-400">你的答案</span>
                  )}
                  {isCorrect && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">正确答案</span>
                  )}
                </li>
              );
            })}
          </ul>
          {item.question.explanation && (
            <div className="mt-3 rounded-md border-l-4 border-primary-300 bg-primary-50/50 p-3 text-sm text-neutral-700 dark:border-primary-700 dark:bg-primary-950/20 dark:text-neutral-300">
              <strong className="text-primary-700 dark:text-primary-300">解析: </strong>
              {item.question.explanation}
            </div>
          )}
          {!item.resolved && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <Link
                href={`/courses/${item.course.slug}/${item.chapter.slug}/`}
                className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline dark:text-primary-300"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 回到章节重做
              </Link>
              <Button onClick={onMarkResolved} disabled={busy} size="sm" variant="secondary">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                标为已会
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
