"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Award, Check, FileText, Loader2, Plus, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { SEARCH_INDEX } from "@/lib/search";

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseSlug: string;
  chapterSlug: string | null;
  maxScore: number;
  dueDate: string | null;
  keywords: string;
  createdAt: string;
  createdBy: { id: string; displayName: string | null; email: string };
  _count: { submissions: number };
}

const COURSE_SLUGS = Array.from(new Set(SEARCH_INDEX.map((e) => e.courseSlug)));

export function AdminAssignmentsClient() {
  const { user, ready } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [grading, setGrading] = useState<any | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (user && (user.role === "admin" || user.role === "superadmin")) load();
    else setLoading(false);
  }, [ready, user]);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/assignment/");
    const j = await r.json();
    if (j.ok) setAssignments(j.data.assignments);
    setLoading(false);
  }

  async function handleCreate() {
    if (!title.trim() || !description.trim() || !courseSlug) return;
    setBusy(true);
    try {
      const keywords = keywordsInput.split(/[,，]/).map((k) => k.trim()).filter(Boolean);
      const r = await fetch("/api/assignment/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          courseSlug,
          maxScore,
          dueDate: dueDate || undefined,
          keywords,
        }),
      });
      const j = await r.json();
      if (j.ok) {
        setShowCreate(false);
        setTitle("");
        setDescription("");
        setCourseSlug("");
        setMaxScore(100);
        setDueDate("");
        setKeywordsInput("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return (
      <div className="container py-12">
        <Link href="/admin/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="h-3.5 w-3.5" /> 回到 admin
        </Link>
        <p className="mt-6 text-center text-sm text-neutral-500">无权限访问</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到 admin
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📝 作业管理</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            布置作业, 自动评分 (基于关键词), 人工补充反馈
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "取消" : "布置作业"}
        </button>
      </div>

      {showCreate && (
        <section className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800/50 dark:bg-primary-950/20">
          <h2 className="text-sm font-semibold">新作业</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-neutral-500">标题 *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如: 用 scikit-learn 训练第一个分类模型"
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-neutral-500">描述 *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="作业要求, 提交格式, 评分标准..."
                rows={4}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">课程 *</label>
              <select
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">选择课程</option>
                {COURSE_SLUGS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">满分</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">截止日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">评分关键词 (逗号分隔)</label>
              <input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="sklearn, fit, predict, accuracy"
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={busy || !title.trim() || !description.trim() || !courseSlug}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            布置
          </button>
        </section>
      )}

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          还没有布置任何作业, 点击右上'布置作业'开始
        </div>
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => {
            let kws: string[] = [];
            try { kws = JSON.parse(a.keywords); } catch {}
            return (
              <li key={a.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary-600" />
                      <Link href={`/assignments/${a.id}/`} className="font-semibold hover:underline">{a.title}</Link>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{a.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                      <span className="font-mono">{a.courseSlug}</span>
                      <span>·</span>
                      <span><Users className="inline h-3 w-3" /> {a._count.submissions} 人提交</span>
                      <span>·</span>
                      <span>满分 {a.maxScore}</span>
                      {kws.length > 0 && <span>· 关键词 {kws.length} 个</span>}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const r = await fetch(`/api/assignment/${a.id}/submissions/`);
                      const j = await r.json();
                      if (j.ok) setGrading({ assignment: a, submissions: j.data.submissions });
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  >
                    <Award className="h-3 w-3" /> 批改
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 批改 Modal */}
      {grading && (
        <GradingModal
          assignment={grading.assignment}
          submissions={grading.submissions}
          onClose={() => setGrading(null)}
          onGraded={() => load()}
        />
      )}
    </div>
  );
}

function GradingModal({ assignment, submissions, onClose, onGraded }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">📋 批改 - {assignment.title}</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {submissions.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">还没有人提交</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {submissions.map((sub: any) => (
              <SubmissionRow key={sub.id} sub={sub} assignment={assignment} onGraded={onGraded} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SubmissionRow({ sub, assignment, onGraded }: any) {
  const [score, setScore] = useState(sub.score ?? assignment.maxScore);
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const r = await fetch(`/api/assignment/${assignment.id}/grade/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: sub.id, score, feedback }),
      });
      const j = await r.json();
      if (j.ok) onGraded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-mono text-neutral-500">{sub.user?.email ?? sub.userId}</span>
        <span className="text-neutral-400">{new Date(sub.submittedAt).toLocaleString("zh-CN")}</span>
      </div>
      <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-neutral-50 p-2 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        {sub.content}
      </pre>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-[10px] text-neutral-500">分数:</label>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          min={0}
          max={assignment.maxScore}
          className="w-16 rounded border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
        />
        <span className="text-[10px] text-neutral-500">/ {assignment.maxScore}</span>
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="老师反馈 (可选)"
          className="ml-auto flex-1 rounded border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          保存
        </button>
      </div>
    </li>
  );
}
