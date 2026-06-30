"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Send, X, Loader2, ChevronRight, Bot, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  score: number;
  excerpt: string;
}

interface AnswerState {
  question: string;
  answer: string;
  sources: Source[];
  pending: boolean;
  error?: string;
  provider?: string;
}

interface Props {
  courseSlug: string;
  chapterSlug: string;
  chapterTitle: string;
}

const SUGGESTIONS = [
  "这章的核心概念是什么?",
  "能举一个实际例子吗?",
  "这章跟前面的章节有什么联系?",
  "学这章需要什么前置知识?",
];

export function ChapterAskBox({ courseSlug, chapterSlug, chapterTitle }: Props) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<AnswerState | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setInput("");
    setLoading(true);
    setState({ question: q, answer: "", sources: [], pending: true });

    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          topK: 3,
          chapterHint: { courseSlug, chapterSlug, chapterTitle },
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("空响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let sources: Source[] = [];
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
            setState({ question: q, answer: acc, sources, pending: true, provider: obj.provider });
          } catch (e: any) {
            // JSON parse fail, skip
            if (e?.message && !e.message.includes("JSON")) throw e;
          }
        }
      }
      setState({ question: q, answer: acc, sources, pending: false });
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setState({
        question: q,
        answer: "",
        sources: [],
        pending: false,
        error: e?.message || "请求失败",
      });
    } finally {
      setLoading(false);
    }
  }

  function close() {
    abortRef.current?.abort();
    setState(null);
    setLoading(false);
  }

  return (
    <section
      data-testid="chapter-ask-box"
      className="overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:border-purple-900/50 dark:from-purple-950/30 dark:via-neutral-900 dark:to-indigo-950/30"
    >
      <div className="border-b border-purple-100 bg-purple-50/40 px-5 py-3 dark:border-purple-900/40 dark:bg-purple-950/20">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-purple-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            还有疑问? 问问 AI (v19.5)
          </h3>
          {state && !state.pending && (
            <button
              type="button"
              onClick={close}
              className="ml-auto inline-flex items-center gap-1 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          基于全站 19 门课 68 章内容检索 + LLM 总结, 会引用具体章节作为出处
        </p>
      </div>

      <div className="px-5 py-4">
        {!state || (state.pending && !state.answer) ? (
          <>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                placeholder={`比如: 「${chapterTitle}这章有什么易错点?」`}
                className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => ask(input)}
                disabled={!input.trim() || loading}
                className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">提问</span>
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  disabled={loading}
                  className="rounded-full border border-purple-200 bg-white px-2.5 py-1 text-xs text-purple-700 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 dark:border-purple-800 dark:bg-neutral-900 dark:text-purple-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        ) : (
          <AnswerView state={state} chapterTitle={chapterTitle} onAskMore={ask} />
        )}
      </div>
    </section>
  );
}

function AnswerView({
  state,
  chapterTitle,
  onAskMore,
}: {
  state: AnswerState;
  chapterTitle: string;
  onAskMore: (q: string) => void;
}) {
  const [followUp, setFollowUp] = useState("");

  return (
    <div>
      <div className="mb-3 flex items-start gap-2">
        <Bot className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
        <div className="flex-1">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">关于「{chapterTitle}」</div>
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{state.question}</div>
        </div>
      </div>

      {state.error ? (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          出错了: {state.error}
        </div>
      ) : (
        <>
          <div className="prose prose-sm prose-purple max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap leading-relaxed">
              {state.answer}
              {state.pending && (
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-purple-500 align-middle" />
              )}
            </p>
          </div>

          {state.sources.length > 0 && (
            <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                <BookOpen className="h-3 w-3" />
                参考来源 ({state.sources.length})
              </div>
              <ul className="space-y-1.5">
                {state.sources.map((s, i) => (
                  <li key={i}>
                    <Link
                      href={`/courses/${s.courseSlug}/${s.chapterSlug}/`}
                      target="_blank"
                      className="group flex items-start gap-2 rounded-md border border-neutral-200 bg-white p-2 transition hover:border-purple-300 hover:bg-purple-50/40 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-purple-700 dark:hover:bg-purple-950/20"
                    >
                      <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-[9px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-purple-700 group-hover:underline dark:text-purple-300">
                            {s.chapterTitle}
                          </span>
                          <span className="text-[9px] text-neutral-400">{(s.score * 100).toFixed(0)}% 相关</span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                          {s.excerpt}
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 flex-shrink-0 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-purple-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 追问输入 */}
          {!state.pending && (
            <div className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && followUp.trim()) {
                    onAskMore(followUp);
                    setFollowUp("");
                  }
                }}
                placeholder="追问一下..."
                className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs placeholder:text-neutral-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <button
                type="button"
                onClick={() => {
                  if (followUp.trim()) {
                    onAskMore(followUp);
                    setFollowUp("");
                  }
                }}
                disabled={!followUp.trim()}
                className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
              >
                <Send className="h-3 w-3" />
                追问
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}