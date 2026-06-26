"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock, FileText, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

interface Proposal {
  id: string;
  type: "proposal";
  title: string;
  description: string;
  scope: string;
  courseSlug: string;
  chapterSlug: string | null;
  courseTitle?: string;
  author: { id: string; displayName: string | null; email: string };
  createdAt: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  type: "submission";
  title: string;
  courseSlug: string;
  content: string;
  autoScore: number | null;
  status: string;
  matchDetail: string | null;
  user: { id: string; displayName: string | null; email: string };
  submittedAt: string;
}

interface RecentItem {
  id: string;
  title: string;
  score: number | null;
  user: { displayName: string | null; email: string } | null;
  gradedAt: string | null;
}

interface QueueData {
  proposals: Proposal[];
  submissions: Submission[];
  recentReviewed: RecentItem[];
  counts: { proposalsPending: number; submissionsPending: number };
}

export function ReviewClient() {
  const { user, ready } = useAuth();
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proposals" | "submissions">("proposals");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role !== "admin" && user.role !== "superadmin") {
      setLoading(false);
      return;
    }
    load();
  }, [ready, user]);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/review/queue/");
    const j = await r.json();
    if (j.ok) setData(j.data);
    setLoading(false);
  }

  async function approve(kind: "proposal" | "submission", id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/review/${id}/approve/?kind=${kind}`, { method: "POST", credentials: "include" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(kind: "proposal" | "submission", id: string) {
    const reason = prompt("拒绝原因 (可选, 会作为作业 feedback)?") ?? "";
    setBusyId(id);
    try {
      await fetch(`/api/admin/review/${id}/reject/?kind=${kind}&reason=${encodeURIComponent(reason)}`, { method: "POST", credentials: "include" });
      await load();
    } finally {
      setBusyId(null);
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
        <p className="mt-6 text-center text-sm text-neutral-500">无权限</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-12 text-center">
        <p className="text-sm text-red-500">加载失败</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到 admin
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Sparkles className="h-7 w-7 text-primary-600" />
          内容审核中心
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          统一处理 proposals + 作业批改, 一键通过/拒绝
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-800/50 dark:bg-violet-950/20">
          <div className="text-xs text-neutral-500">待审核 proposals</div>
          <div className="mt-1 bg-gradient-to-br from-violet-500 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
            {data.counts.proposalsPending}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
          <div className="text-xs text-neutral-500">待批改作业</div>
          <div className="mt-1 bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-3xl font-bold text-transparent">
            {data.counts.submissionsPending}
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab("proposals")}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
            activeTab === "proposals"
              ? "border-primary-500 text-primary-700 dark:text-primary-300"
              : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
          )}
        >
          <FileText className="mr-1 inline h-3.5 w-3.5" />
          Proposals ({data.counts.proposalsPending})
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
            activeTab === "submissions"
              ? "border-primary-500 text-primary-700 dark:text-primary-300"
              : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
          )}
        >
          📝 作业批改 ({data.counts.submissionsPending})
        </button>
      </div>

      {/* Proposals */}
      {activeTab === "proposals" && (
        <>
          {data.proposals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
              🎉 没有待审核 proposals
            </div>
          ) : (
            <ul className="space-y-3">
              {data.proposals.map((p) => (
                <li key={p.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50">
                          {p.scope}
                        </span>
                        <h3 className="font-semibold">{p.title}</h3>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {p.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                        <Link href={`/courses/${p.courseSlug}/`} className="font-mono hover:underline">
                          {p.courseSlug}{p.chapterSlug ? `/${p.chapterSlug}` : ""}
                        </Link>
                        {p.courseTitle && <span>· {p.courseTitle}</span>}
                        <span>· 作者: {p.author.displayName ?? p.author.email}</span>
                        <span>· {new Date(p.createdAt).toLocaleString("zh-CN")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/proposals/${p.id}/`}
                        className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                      >
                        查看
                      </Link>
                      <button
                        onClick={() => approve("proposal", p.id)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busyId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        通过
                      </button>
                      <button
                        onClick={() => reject("proposal", p.id)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                        拒绝
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Submissions */}
      {activeTab === "submissions" && (
        <>
          {data.submissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
              🎉 没有待批改作业
            </div>
          ) : (
            <ul className="space-y-3">
              {data.submissions.map((s) => {
                let detail: any = null;
                if (s.matchDetail) { try { detail = JSON.parse(s.matchDetail); } catch {} }
                return (
                  <li key={s.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50">
                            <Clock className="mr-0.5 h-2.5 w-2.5" />{s.status === "submitted" ? "待评分" : "自动评分"}
                          </span>
                          <h3 className="font-semibold">{s.title}</h3>
                          {s.autoScore !== null && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
                              自动 {s.autoScore} 分
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                          {s.content}
                        </p>
                        {detail && (
                          <div className="mt-1.5 rounded bg-neutral-50 p-2 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            关键词命中: <strong className="text-emerald-600">{detail.hits?.length}/{detail.total}</strong> ({detail.hitRate})
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                          <span>提交者: {s.user.displayName ?? s.user.email}</span>
                          <span>·</span>
                          <span>{new Date(s.submittedAt).toLocaleString("zh-CN")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/admin/assignments/`}
                          className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                          详细
                        </Link>
                        <button
                          onClick={() => approve("submission", s.id)}
                          disabled={busyId === s.id}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          通过
                        </button>
                        <button
                          onClick={() => reject("submission", s.id)}
                          disabled={busyId === s.id}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          拒绝
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {data.recentReviewed.length > 0 && (
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">📜 最近已批改</h2>
              <ul className="space-y-1.5 text-[11px]">
                {data.recentReviewed.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="flex-1 truncate">{r.title}</span>
                    <span className="text-neutral-500">{r.user?.displayName ?? r.user?.email}</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">{r.score ?? "?"} 分</span>
                    <span className="text-neutral-400">{r.gradedAt ? new Date(r.gradedAt).toLocaleDateString("zh-CN") : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
