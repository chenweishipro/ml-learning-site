"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, MessageCircle, Plus, Send, Sparkles, Trash2, User as UserIcon, MessageSquarePlus } from "lucide-react";
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
  streaming?: boolean;
  error?: string;
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

const SUGGESTIONS = [
  "什么是过拟合? 怎么避免?",
  "机器学习和深度学习的区别是什么?",
  "贝叶斯定理在 ML 里怎么用?",
  "梯度下降怎么工作的?",
  "反向传播的数学原理",
  "强化学习跟监督学习有什么区别?",
  "CNN 为什么适合图像?",
  "决策树怎么剪枝?",
  "如何选择模型评估指标?",
  "RNN 和 Transformer 的核心区别?",
  "中心极限定理为什么重要?",
  "如何用 Python 调通一个最小神经网络?",
];

const SUGGESTION_GROUPS = [
  {
    emoji: "💡",
    label: "基础概念",
    items: ["什么是过拟合? 怎么避免?", "机器学习和深度学习的区别是什么?", "贝叶斯定理在 ML 里怎么用?"],
  },
  {
    emoji: "🧮",
    label: "算法原理",
    items: ["梯度下降怎么工作的?", "反向传播的数学原理", "决策树怎么剪枝?"],
  },
  {
    emoji: "🚀",
    label: "架构 / 实战",
    items: ["CNN 为什么适合图像?", "RNN 和 Transformer 的核心区别?", "如何用 Python 调通一个最小神经网络?"],
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 加载 session 列表
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/chat/sessions/", { credentials: "include" });
        if (!r.ok) return;
        const j = await r.json();
        if (j.ok) setSessions(j.data);
      } catch {}
    })();
  }, [messages.length === 0 ? 0 : messages.length]); // refetch after each new convo

  // 加载指定 session
  async function loadSession(id: string) {
    setSessionId(id);
    setLoading(true);
    try {
      const r = await fetch(`/api/chat/sessions/${id}/`, { credentials: "include" });
      if (!r.ok) return;
      const j = await r.json();
      if (j.ok && j.data?.messages) {
        setMessages(j.data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.citations ? JSON.parse(m.citations) : undefined,
        })));
      }
    } finally {
      setLoading(false);
    }
  }

  async function newSession() {
    setMessages([]);
    setSessionId(null);
  }

  async function deleteCurrentSession() {
    if (!sessionId) {
      newSession();
      return;
    }
    if (!confirm("删除当前对话?")) return;
    await fetch(`/api/chat/sessions/${sessionId}/`, { method: "DELETE", credentials: "include" });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    newSession();
  }

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
      { id: aiId, role: "assistant", content: "", pending: true, streaming: true },
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
        body: JSON.stringify({ sessionId, query: q, topK: 3, stream: true }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      // SSE 流式解析
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let sources: any[] | undefined;
      let acc = "";
      let providerName = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          try {
            const obj = JSON.parse(data);
            if (obj.type === "sources") {
              sources = obj.data;
              // 马上渲染参考资料, 不等答案
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, sources } : m
                )
              );
            } else if (obj.type === "chunk") {
              acc += obj.data;
              // 流式累加, 每次 update 都刷新这一条消息
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? {
                        id: aiId,
                        role: "assistant",
                        content: acc,
                        sources: sources ?? m.sources,
                        streaming: true,
                      }
                    : m
                )
              );
            } else if (obj.type === "done") {
              providerName = obj.data?.provider ?? "";
            } else if (obj.type === "error") {
              throw new Error(obj.data);
            }
          } catch {
            /* ignore malformed */
          }
        }
      }

      // 流结束: 补全 provider 信息
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId ? { ...m, content: acc, provider: providerName, pending: false } : m
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
    <div className="container max-w-6xl py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:ring-purple-800/50">
            <Sparkles className="h-3 w-3" />
            AI 答疑 · 多轮对话
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">问 AI 助教</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            基于全站 44 章节的 RAG 答疑 · 多轮上下文 · 答案标注来源
          </p>
        </div>
        <button
          onClick={newSession}
          className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          <MessageSquarePlus className="h-4 w-4" />
          新对话
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* 左侧: session 列表 */}
        <aside className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">历史对话</h3>
          {sessions.length === 0 ? (
            <p className="px-2 py-3 text-xs text-neutral-500">还没有对话</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => loadSession(s.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
                      sessionId === s.id
                        ? "bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    <MessageCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{s.title}</div>
                      <div className="text-[10px] text-neutral-500">
                        {s._count?.messages ?? 0} 条 · {new Date(s.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* 右侧: chat 窗口 */}
        <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Bot className="h-3.5 w-3.5 text-purple-500" />
            <span>AI 助教</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={deleteCurrentSession}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
              title="删除当前对话"
            >
              <Trash2 className="h-3 w-3" />
              清空
            </button>
          )}
        </div>

        <div className="h-[480px] overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-purple-50 text-purple-600 ring-1 ring-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-800/50">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-50">
                AI 智能问答 (v19.5)
              </h3>
              <p className="mb-5 text-xs text-neutral-500 dark:text-neutral-400">
                基于全站 19 门课 68 章内容检索 + LLM 总结, 回答会引用具体出处
              </p>
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {SUGGESTION_GROUPS.map((g) => (
                  <div
                    key={g.label}
                    className="rounded-xl border border-neutral-200 bg-white p-3 text-left dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      <span className="text-base">{g.emoji}</span>
                      {g.label}
                    </div>
                    <div className="space-y-1.5">
                      {g.items.map((s) => (
                        <button
                          key={s}
                          onClick={() => ask(s)}
                          className="block w-full rounded-md px-2 py-1 text-left text-xs text-neutral-700 transition hover:bg-purple-50 hover:text-purple-700 dark:text-neutral-300 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
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
        {m.pending && !m.streaming ? (
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>正在查资料 + 思考...</span>
          </div>
        ) : m.error ? (
          <p className="text-rose-600 dark:text-rose-400">⚠️ {m.error}</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{m.content}
              {/* 打字光标 (仅在流式传输中显示) */}
              {m.streaming && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-purple-500 align-middle" />}
            </p>
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

            {/* 反馈按钮 (v19.5) */}
            {m.role === "assistant" && !m.pending && !m.error && (
              <FeedbackButtons messageId={m.id} />
            )}
          </>
        )}
      </div>
    </li>
  );
}

/** 👍/👎 反馈按钮 (v19.5) */
function FeedbackButtons({ messageId }: { messageId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rag/feedback/?messageId=${messageId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.ok && j.feedback) {
          setRating(j.feedback.rating);
          setComment(j.feedback.comment || "");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  async function submit(r: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/rag/feedback/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: r, comment }),
      });
      const j = await res.json();
      if (j.ok) {
        setRating(r);
        if (r === 1 && !comment) setShowComment(true);
      }
    } catch {
    } finally {
      setBusy(false);
    }
  }

  if (rating !== null) {
    return (
      <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-400">
        <span>已反馈: {rating === 5 ? "👍 有用" : "👎 没帮助"}</span>
        {comment && <span className="line-clamp-1 italic">"{comment}"</span>}
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => submit(5)}
        disabled={busy}
        title="这个回答有用"
        className="rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-xs text-neutral-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
      >
        👍 有用
      </button>
      <button
        type="button"
        onClick={() => submit(1)}
        disabled={busy}
        title="这个回答没帮助"
        className="rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-xs text-neutral-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-rose-700 dark:hover:bg-rose-950/30"
      >
        👎 没帮助
      </button>
      {showComment && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(1);
          }}
          className="ml-2 flex items-center gap-1"
        >
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="哪里不对? (可选)"
            className="h-6 w-40 rounded border border-neutral-200 bg-white px-2 text-[10px] dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            className="h-6 rounded bg-rose-600 px-2 text-[10px] font-medium text-white hover:bg-rose-700"
          >
            提交
          </button>
        </form>
      )}
    </div>
  );
}
