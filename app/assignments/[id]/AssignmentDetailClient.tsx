"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Loader2, Send, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

interface Submission {
  id: string;
  content: string;
  status: string;
  score: number | null;
  feedback: string | null;
  matchDetail: string | null;
  submittedAt: string;
  gradedAt: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseSlug: string;
  chapterSlug: string | null;
  maxScore: number;
  dueDate: string | null;
  keywords: string;
  createdBy: { id: string; displayName: string | null; email: string };
  createdAt: string;
  _count: { submissions: number };
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  submitted: { label: "已提交", color: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50" },
  "auto-graded": { label: "自动评分", color: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50" },
  reviewed: { label: "已批改", color: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50" },
};

export function AssignmentDetailClient({ assignmentId }: { assignmentId: string }) {
  const { user, ready } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/assignment/${assignmentId}/`);
      const j = await r.json();
      if (j.ok) {
        setAssignment(j.data.assignment);
        setMySubmission(j.data.mySubmission);
        if (j.data.mySubmission?.content) setContent(j.data.mySubmission.content);
      }
      setLoading(false);
    })();
  }, [assignmentId]);

  async function handleSubmit() {
    if (!content.trim()) {
      setError("作业内容不能为空");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/assignment/${assignmentId}/submit/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const j = await r.json();
      if (!j.ok) {
        setError(j.error ?? "提交失败");
        return;
      }
      setMySubmission(j.data.submission);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container py-12 text-center">
        <p className="text-sm text-neutral-500">作业不存在</p>
        <Link href="/assignments/" className="mt-2 inline-block text-sm text-primary-700 hover:underline">
          ← 返回作业列表
        </Link>
      </div>
    );
  }

  let keywords: string[] = [];
  try { keywords = JSON.parse(assignment.keywords); } catch {}

  const statusMeta = mySubmission ? STATUS_META[mySubmission.status] ?? STATUS_META.submitted : null;
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !mySubmission;

  let matchDetail: any = null;
  if (mySubmission?.matchDetail) {
    try { matchDetail = JSON.parse(mySubmission.matchDetail); } catch {}
  }

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/assignments/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400">
        <ArrowLeft className="h-3.5 w-3.5" /> 返回作业列表
      </Link>

      <article className="mt-4">
        <header className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {statusMeta && (
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", statusMeta.color)}>
                {statusMeta.label}
                {mySubmission?.score !== null && mySubmission?.score !== undefined ? ` · ${mySubmission.score}分` : ""}
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800/50">
                已过期
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
              <BookOpen className="h-3 w-3" /> {assignment.courseSlug}
            </span>
            {assignment.dueDate && (
              <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
                <Calendar className="h-3 w-3" /> 截止 {new Date(assignment.dueDate).toLocaleDateString("zh-CN")}
              </span>
            )}
            <span className="ml-auto text-[10px] text-neutral-500">满分 {assignment.maxScore}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {assignment.description}
          </p>

          {keywords.length > 0 && (
            <div className="mt-4 rounded-md bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                🔑 自动评分关键词 (提交后系统检查)
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {keywords.map((k) => (
                  <span key={k} className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-amber-700 ring-1 ring-amber-200 dark:bg-neutral-900 dark:text-amber-300 dark:ring-amber-800/50">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-[10px] text-neutral-500">
            <User className="h-3 w-3" />
            出题人: {assignment.createdBy.displayName ?? assignment.createdBy.email}
            <span>· {assignment._count.submissions} 人提交</span>
          </div>
        </header>

        {/* 提交表单 */}
        {ready && user ? (
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-semibold">{mySubmission ? "✏️ 修改提交" : "📝 提交作业"}</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的作业内容..."
              rows={10}
              maxLength={5000}
              className="mt-3 w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
              disabled={!!isOverdue}
            />
            <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
              <span>{content.length} / 5000 字</span>
              {error && <span className="text-red-600">{error}</span>}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || isOverdue || !content.trim()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {mySubmission ? "重新提交" : "提交作业"}
            </button>
          </section>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
            <Link href="/login/" className="text-primary-700 hover:underline">登录</Link> 后可提交作业
          </div>
        )}

        {/* 已提交结果 */}
        {mySubmission && (
          <section className="mt-6 rounded-2xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-amber-50 p-6 dark:border-primary-700 dark:from-primary-950/30 dark:to-amber-950/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold">你的提交结果</h2>
            </div>
            {mySubmission.score !== null && (
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-700 dark:text-primary-300">{mySubmission.score}</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">/ {assignment.maxScore} 分</span>
              </div>
            )}
            {matchDetail && (
              <div className="mt-3 rounded-md bg-white/60 p-3 text-xs dark:bg-neutral-900/30">
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">关键词命中详情:</p>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                  命中 <strong className="text-emerald-600">{matchDetail.hits?.length || 0}</strong> / {matchDetail.total} 个 ({matchDetail.hitRate})
                </p>
                {matchDetail.missed?.length > 0 && (
                  <p className="mt-1 text-neutral-500">
                    缺失: {matchDetail.missed.map((k: string) => <span key={k} className="mr-1 font-mono text-[10px]">{k}</span>)}
                  </p>
                )}
              </div>
            )}
            {mySubmission.feedback && (
              <div className="mt-3 rounded-md bg-white p-3 text-sm dark:bg-neutral-900">
                <p className="font-semibold">👨‍🏫 老师反馈</p>
                <p className="mt-1 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                  {mySubmission.feedback}
                </p>
              </div>
            )}
            <p className="mt-3 text-[10px] text-neutral-500">
              提交于 {new Date(mySubmission.submittedAt).toLocaleString("zh-CN")}
              {mySubmission.gradedAt ? ` · 评分于 ${new Date(mySubmission.gradedAt).toLocaleString("zh-CN")}` : ""}
            </p>
          </section>
        )}
      </article>
    </div>
  );
}
