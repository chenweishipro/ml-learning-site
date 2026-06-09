"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  ChevronUp,
  Eye,
  Loader2,
  MessageSquare,
  Send,
  ThumbsUp,
  Trash2,
  User as UserIcon,
  Tag,
} from "lucide-react";
import { useAuth, type Role } from "@/components/auth-provider";
import { isAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface QAUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

interface Answer {
  id: string;
  body: string;
  authorId: string;
  author: QAUser;
  accepted: boolean;
  voteCount: number;
  status: string;
  createdAt: string;
  _count: { votes: number };
}

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
  updatedAt: string;
  authorId: string;
  author: QAUser;
  answers: Answer[];
}

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [q, setQ] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${params.id}/`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setQ(data.data.question);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${params.id}/answers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "提交失败");
        return;
      }
      setDraft("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(answerId: string) {
    if (!user) return;
    setVoting(answerId);
    try {
      const res = await fetch(`/api/answers/${answerId}/vote/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setQ((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            answers: prev.answers.map((a) =>
              a.id === answerId ? { ...a, voteCount: data.data.voteCount } : a
            ),
          };
        });
      }
    } finally {
      setVoting(null);
    }
  }

  async function handleAccept(answerId: string) {
    if (!user || !q) return;
    try {
      const res = await fetch(`/api/answers/${answerId}/accept/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId: q.id }),
      });
      const data = await res.json();
      if (data.ok) await load();
    } catch (e) {
      // ignore
    }
  }

  if (loading || !q) {
    return (
      <div className="container py-12">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
            <Link href="/qa/" className="ml-2 text-primary-700 hover:underline">返回</Link>
          </div>
        ) : (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
        )}
      </div>
    );
  }

  const isAuthor = user?.id === q.authorId;
  const isAdminUser = user ? isAdmin(user.role as Role) : false;
  const canAccept = isAuthor || isAdminUser;

  const acceptedAnswer = q.answers.find((a) => a.accepted);
  const otherAnswers = q.answers.filter((a) => !a.accepted);

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/qa/" className="inline-flex items-center gap-1 hover:text-primary-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          返回问答
        </Link>
      </div>

      {/* 标题 + 状态 */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {q.status === "answered" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
                <CheckCircle2 className="h-3 w-3" />
                已解答
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800/50">
                <MessageSquare className="h-3 w-3" />
                待解答
              </span>
            )}
            {q.courseSlug && (
              <Link
                href={`/courses/${q.courseSlug}/${q.chapterSlug ?? ""}/`}
                className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 ring-1 ring-primary-200 hover:bg-primary-100 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50"
              >
                {q.courseSlug}
                {q.chapterSlug && ` / ${q.chapterSlug}`}
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{q.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              {q.author.displayName || q.author.email}
            </span>
            <span>{new Date(q.createdAt).toLocaleString("zh-CN")}</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> {q.viewCount} 浏览
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {q.answerCount} 答
            </span>
            {q.tags.split(",").filter(Boolean).map((t) => (
              <Link
                key={t}
                href={`/qa/?tag=${encodeURIComponent(t.trim())}`}
                className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                #{t.trim()}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 问题正文 */}
      <article className="prose-chinese mb-6 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {q.body}
        </div>
      </article>

      {/* 答案列表 */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {q.answerCount} 个回答
        </h2>

        {acceptedAnswer && (
          <div className="mb-3">
            <AnswerCard
              key={acceptedAnswer.id}
              a={acceptedAnswer}
              currentUserId={user?.id}
              canAccept={canAccept}
              voting={voting === acceptedAnswer.id}
              onVote={handleVote}
              onAccept={handleAccept}
            />
          </div>
        )}

        <ul className="space-y-3">
          {otherAnswers.map((a) => (
            <li key={a.id}>
              <AnswerCard
                a={a}
                currentUserId={user?.id}
                canAccept={canAccept}
                voting={voting === a.id}
                onVote={handleVote}
                onAccept={handleAccept}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* 写回答 */}
      {user ? (
        <form onSubmit={handleAnswer} className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-50">写下你的回答</h3>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="分享你的见解, 引用相关章节更佳..."
            maxLength={10000}
            rows={5}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
          {error && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500">{draft.length} / 10000</span>
            <button
              type="submit"
              disabled={submitting || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              提交回答
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-md border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
          <Link href="/login" className="text-primary-700 hover:underline">登录</Link> 后回答
        </div>
      )}
    </div>
  );
}

function AnswerCard({
  a,
  currentUserId,
  canAccept,
  voting,
  onVote,
  onAccept,
}: {
  a: Answer;
  currentUserId?: string;
  canAccept: boolean;
  voting: boolean;
  onVote: (id: string) => void;
  onAccept: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 dark:bg-neutral-900",
        a.accepted
          ? "border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-800/50 dark:ring-emerald-800/30"
          : "border-neutral-200 dark:border-neutral-800"
      )}
    >
      <div className="flex gap-3">
        {/* 左侧: 投票 + 采纳 */}
        <div className="flex w-12 flex-shrink-0 flex-col items-center gap-1">
          <button
            onClick={() => onVote(a.id)}
            disabled={voting || !currentUserId}
            className="grid h-8 w-8 place-items-center rounded-md border border-neutral-200 transition hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
            title={currentUserId ? "点赞" : "登录后点赞"}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
            {a.voteCount}
          </span>
          {a.accepted && (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" title="已采纳">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          )}
        </div>

        {/* 右侧: 内容 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <UserIcon className="h-3 w-3" />
            <span>{a.author.displayName || a.author.email}</span>
            {a.author.role !== "user" && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                {a.author.role === "superadmin" ? "超管" : "管理员"}
              </span>
            )}
            <span>· {new Date(a.createdAt).toLocaleString("zh-CN")}</span>
            {a.accepted && (
              <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
                ✅ 已采纳
              </span>
            )}
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            {a.body}
          </div>
          {canAccept && !a.accepted && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => onAccept(a.id)}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                <Check className="h-3 w-3" />
                采纳此答案
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
