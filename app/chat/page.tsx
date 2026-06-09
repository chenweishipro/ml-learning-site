"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, MessageCircle, Send, Sparkles, Trash2, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  score: number;
  excerpt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  provider?: string;
  pending?: boolean;
  error?: string;
}

const SUGGESTIONS = [
  "什么是过拟合?",
  "梯度下降怎么工作的?",
  "反向传播的数学原理",
  "强化学习跟监督学习有什么区别?",
  "CNN 为什么适合图像?",
  "决策树怎么剪枝?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: q };
    const aiId = `ai-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aiId, role: "assistant", content: "", pending: true },
    ]);
    setInput("");
    setLoading(true);
    try {
      // 取最近 6 条历史
      const history = messages
        .filter((m) => !m.pending)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, history, topK: 3 }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "请求失败");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? {
                id: aiId,
                role: "assistant",
                content: data.data.answer,
                sources: data.data.sources,
                provider: data.data.provider,
              }
            : m
        )
      );
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { id: aiId, role: "assistant", content: "", error: e instanceof Error ? e.message : "出错了" }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-3xl py-8 sm:py-10">
      <div className="mb-6 text-center">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:ring-purple-800/50">
          <Sparkles className="h-3 w-3" />
          AI 答疑
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">问 AI 助教</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          基于本站 23 个章节的 RAG 答疑 · 答案会标注来源
        </p>
      </div>

      {/* 聊天窗口 */}
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Bot className="h-3.5 w-3.5 text-purple-500" />
            <span>AI 助教</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
            >
              <Trash2 className="h-3 w-3" />
              清空
            </button>
          )}
        </div>

        <div className="h-[480px] overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
              <p className="mb-4 text-sm text-neutral-500">试着问点什么:</p>
              <div className="flex max-w-md flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-purple-700 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
              <div ref={bottomRef} />
            </ul>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="输入问题, Enter 发送 (Shift+Enter 换行)..."
            rows={1}
            maxLength={2000}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-purple-900"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-md bg-purple-600 text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <p className="mt-3 text-center text-[11px] text-neutral-500">
        💡 默认本地 mock 模式 (无 API key 也能用)。配置 <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">LLM_PROVIDER=openai OPENAI_API_KEY=sk-xxx</code> 启用真实 LLM
      </p>
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  if (m.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-purple-600 px-4 py-2.5 text-sm text-white shadow-sm">
          <p className="whitespace-pre-wrap">{m.content}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-purple-200">
            <UserIcon className="h-2.5 w-2.5" />
            你
          </div>
        </div>
      </li>
    );
  }
  return (
    <li className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] text-purple-600 dark:text-purple-400">
          <Bot className="h-3 w-3" />
          AI 助教
          {m.provider && <span className="rounded bg-purple-50 px-1.5 py-0.5 dark:bg-purple-950/30">{m.provider}</span>}
        </div>
        {m.pending ? (
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>正在查资料 + 思考...</span>
          </div>
        ) : m.error ? (
          <p className="text-rose-600 dark:text-rose-400">⚠️ {m.error}</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">📚 参考来源</p>
                <ul className="space-y-1">
                  {m.sources.map((s, i) => (
                    <li key={i} className="text-[11px]">
                      <Link
                        href={`/courses/${s.courseSlug}/${s.chapterSlug}/`}
                        target="_blank"
                        className="group block rounded border border-neutral-200 bg-white p-1.5 transition hover:border-purple-300 hover:bg-purple-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-purple-700 dark:hover:bg-purple-950/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-purple-700 group-hover:underline dark:text-purple-300">
                            [{i + 1}] {s.chapterTitle}
                          </span>
                          <span className="text-[9px] text-neutral-500">
                            {(s.score * 100).toFixed(0)}% 相关
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral-600 dark:text-neutral-400">
                          {s.excerpt}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}
