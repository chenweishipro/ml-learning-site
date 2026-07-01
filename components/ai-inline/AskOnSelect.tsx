"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Loader2, X, ChevronRight, BookOpen } from "lucide-react";

interface Props {
  /** 限定范围内的选区才触发 (一般是 MDX 文章容器) */
  scopeSelector?: string;
  /** 选区上下文 (chapter) — 用于 RAG hint */
  chapterHint: {
    courseSlug: string;
    chapterSlug: string;
    chapterTitle: string;
  };
  /** 最少选中多少字才触发 (默认 4) */
  minChars?: number;
  /** 最多选中多少字 (超出会截断 query, 避免长文) */
  maxChars?: number;
}

interface AnswerState {
  question: string;
  answer: string;
  sources: Array<{
    courseSlug: string;
    courseTitle: string;
    chapterSlug: string;
    chapterTitle: string;
    score: number;
    excerpt: string;
  }>;
  pending: boolean;
  error?: string;
}

export function AskOnSelect({ scopeSelector = "article", chapterHint, minChars = 4, maxChars = 500 }: Props) {
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [answer, setAnswer] = useState<AnswerState | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // 监听选区
  useEffect(() => {
    function handleMouseUp() {
      // 关闭 popover 如果点外面
      if (popoverRef.current && !popoverRef.current.contains(document.activeElement as Node)) {
        const sel = window.getSelection();
        const txt = sel?.toString().trim() ?? "";
        if (txt.length < minChars) {
          // 不关闭, 也许用户还在选中
          return;
        }
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelectedText(null);
        setPosition(null);
        return;
      }
      const txt = sel.toString().trim();
      if (txt.length < minChars) {
        setSelectedText(null);
        setPosition(null);
        return;
      }
      // 检查选区是否在 scopeSelector 范围内
      if (scopeSelector) {
        const scope = document.querySelector(scopeSelector);
        if (scope && sel.anchorNode) {
          if (!scope.contains(sel.anchorNode)) {
            setSelectedText(null);
            setPosition(null);
            return;
          }
        }
      }
      // 计算选区右上角位置 (用于浮动按钮)
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelectedText(null);
        setPosition(null);
        return;
      }
      setSelectedText(txt.slice(0, maxChars));
      setPosition({
        x: rect.right + window.scrollX,
        y: rect.top + window.scrollY - 8,
      });
    }

    function handleClickOutside(e: MouseEvent) {
      // 点空白处关掉浮动按钮
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-ask-fab]")
      ) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelectedText(null);
          setPosition(null);
        }
      }
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [scopeSelector, minChars]);

  const ask = useCallback(async () => {
    if (!selectedText || loading) return;
    setLoading(true);
    setAnswer({
      question: selectedText,
      answer: "",
      sources: [],
      pending: true,
    });
    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `解释: ${selectedText}`,
          topK: 2,
          chapterHint,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let sources: AnswerState["sources"] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          try {
            const obj = JSON.parse(payload);
            if (obj.type === "chunk") acc += String(obj.data);
            else if (obj.type === "sources") sources = obj.data;
            else if (obj.type === "error") throw new Error(obj.data);
            setAnswer({ question: selectedText, answer: acc, sources, pending: true });
          } catch (e: any) {
            if (e?.message && !e.message.includes("JSON")) throw e;
          }
        }
      }
      setAnswer({ question: selectedText, answer: acc, sources, pending: false });
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setAnswer({
        question: selectedText,
        answer: "",
        sources: [],
        pending: false,
        error: e?.message || "请求失败",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedText, loading, chapterHint]);

  const closeAll = useCallback(() => {
    abortRef.current?.abort();
    setAnswer(null);
    setSelectedText(null);
    setPosition(null);
    setLoading(false);
    // 清掉选区
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  }, []);

  // Esc 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeAll]);

  return (
    <>
      {/* 浮动 "问 AI" 按钮 */}
      {selectedText && position && !answer && (
        <button
          type="button"
          data-ask-fab
          onClick={(e) => {
            e.stopPropagation();
            ask();
          }}
          className="fixed z-40 inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition hover:bg-purple-700 hover:shadow-xl"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-100%, -100%)",
          }}
        >
          <Sparkles className="h-3 w-3" />
          问 AI
        </button>
      )}

      {/* 答案 popover */}
      {answer && (
        <div
          ref={popoverRef}
          tabIndex={-1}
          className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-2xl px-4"
        >
          <div className="overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl dark:border-purple-800 dark:bg-neutral-900">
            <div className="flex items-start gap-2 border-b border-purple-100 bg-purple-50/60 px-4 py-3 dark:border-purple-900/40 dark:bg-purple-950/30">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400">
                  选中文字解释 · {chapterHint.chapterTitle}
                </div>
                <div className="mt-1 line-clamp-3 rounded bg-purple-100/60 px-2 py-1 text-xs italic text-neutral-700 dark:bg-purple-950/40 dark:text-neutral-300">
                  "{answer.question}"
                </div>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="flex-shrink-0 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
              {answer.error ? (
                <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  出错了: {answer.error}
                </div>
              ) : (
                <>
                  <div className="prose prose-sm prose-purple max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {answer.answer}
                      {answer.pending && (
                        <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-purple-500 align-middle" />
                      )}
                    </p>
                  </div>
                  {answer.sources.length > 0 && (
                    <div className="mt-3 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        <BookOpen className="h-3 w-3" />
                        参考 ({answer.sources.length})
                      </div>
                      <ul className="space-y-1">
                        {answer.sources.map((s, i) => (
                          <li key={i}>
                            <a
                              href={`/courses/${s.courseSlug}/${s.chapterSlug}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-start gap-1.5 rounded border border-neutral-200 bg-white px-2 py-1 text-[10px] transition hover:border-purple-300 hover:bg-purple-50/40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-purple-700"
                            >
                              <span className="mt-0.5 inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-[8px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                {i + 1}
                              </span>
                              <span className="line-clamp-1 font-medium text-purple-700 group-hover:underline dark:text-purple-300">
                                {s.chapterTitle}
                              </span>
                              <span className="ml-auto text-[8px] text-neutral-400">
                                {(s.score * 100).toFixed(0)}%
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-[10px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              <span>按 Esc 关闭 · 基于全站 RAG 检索</span>
              {!answer.pending && (
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-md bg-purple-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-purple-700"
                >
                  知道了
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
