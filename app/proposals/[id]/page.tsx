"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitPullRequestArrow,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  GitMerge,
  Undo2,
  Clock,
  User as UserIcon,
  AlertTriangle,
  RotateCcw,
  Code,
  History,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DiffViewer } from "@/components/proposals/DiffViewer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAuth, type Role } from "@/components/auth-provider";
import { isAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";

type ProposalStatus = "pending" | "approved" | "merged" | "rejected" | "withdrawn";

interface ProposalUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

interface Proposal {
  id: string;
  scope: string;
  courseSlug: string;
  chapterSlug: string | null;
  authorId: string;
  author: ProposalUser;
  title: string;
  description: string;
  proposedBody: string;
  baseSnapshot: string;
  status: ProposalStatus;
  reviewerId: string | null;
  reviewer: ProposalUser | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  mergedAt: string | null;
  mergedRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_META: Record<
  ProposalStatus,
  { label: string; classes: string; icon: typeof GitPullRequestArrow; description: string }
> = {
  pending: {
    label: "等待审核",
    classes: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800/50",
    icon: GitPullRequestArrow,
    description: "管理员会尽快审核你的提案",
  },
  approved: {
    label: "已批准",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50",
    icon: CheckCircle2,
    description: "已批准, 等待合并",
  },
  merged: {
    label: "已合并",
    classes: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50",
    icon: GitMerge,
    description: "修改已合并到课程内容, 感谢你的贡献!",
  },
  rejected: {
    label: "已拒绝",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
    icon: XCircle,
    description: "提案被拒绝, 可以查看理由",
  },
  withdrawn: {
    label: "已撤回",
    classes: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-400 dark:ring-neutral-700",
    icon: Undo2,
    description: "作者已撤回此提案",
  },
};

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [conflictData, setConflictData] = useState<null | { currentBody: string; baseSnapshot: string }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${params.id}/`, { credentials: "include" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setProposal(data.data.proposal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  if (!ready || !user) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error ?? "提案不存在"}
        </div>
        <Link href="/proposals/" className="mt-4 inline-block text-sm text-primary-700 hover:underline">
          ← 返回提案列表
        </Link>
      </div>
    );
  }

  const isAuthor = user.id === proposal.authorId;
  const isAdminUser = isAdmin(user.role as Role);
  const canReview = isAdminUser && !isAuthor;
  const canWithdraw = isAuthor && (proposal.status === "pending" || proposal.status === "approved");
  const statusMeta = STATUS_META[proposal.status];
  const StatusIcon = statusMeta.icon;

  async function handleApprove() {
    if (!proposal) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/approve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reviewNote }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "批准失败");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(note: string) {
    if (!proposal) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/reject/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reviewNote: note }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "拒绝失败");
        return;
      }
      setShowRejectDialog(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function handleMerge(force = false) {
    if (!proposal) return;
    setBusy(true);
    setError(null);
    setConflictData(null);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/merge/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reviewNote, force }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.code === "CONFLICT" && data.data) {
          setConflictData(data.data);
          setError("内容有冲突, 请审核后再决定是否强制合并");
          return;
        }
        setError(data.error ?? "合并失败");
        return;
      }
      setShowMergeDialog(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!proposal) return;
    if (!confirm("确定要撤回这个提案吗?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/withdraw/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "撤回失败");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-6 sm:py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={isAdminUser ? "/admin/proposals/" : "/proposals/"}
          className="inline-flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isAdminUser ? "审核中心" : "我的提案"}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-900 dark:text-neutral-50">#{proposal.id.slice(0, 8)}</span>
      </div>

      {/* 标题 + 状态 */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                statusMeta.classes
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusMeta.label}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {proposal.scope === "chapter" ? "章节" : "课程"} · {proposal.courseSlug}
              {proposal.chapterSlug && ` / ${proposal.chapterSlug}`}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{proposal.title}</h1>
          {proposal.description && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {proposal.description}
            </p>
          )}
        </div>
      </div>

      {/* 元信息条 */}
      <div className="mb-6 grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-xs dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-3">
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            作者
          </div>
          <div className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-50">
            <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
            <span className="font-medium">
              {proposal.author.displayName || proposal.author.email}
            </span>
            {isAuthor && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800/50">
                你
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            提交时间
          </div>
          <div className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-50">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            <span className="tabular-nums">
              {new Date(proposal.createdAt).toLocaleString("zh-CN")}
            </span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {proposal.reviewer ? "审核人" : "状态"}
          </div>
          {proposal.reviewer ? (
            <div className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-50">
              <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
              <span>{proposal.reviewer.displayName || proposal.reviewer.email}</span>
              {proposal.reviewedAt && (
                <span className="text-[11px] text-neutral-500">
                  · {new Date(proposal.reviewedAt).toLocaleString("zh-CN")}
                </span>
              )}
            </div>
          ) : (
            <div className="text-neutral-500">—</div>
          )}
        </div>
      </div>

      {/* 拒绝原因 */}
      {proposal.status === "rejected" && proposal.reviewNote && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-800/40 dark:bg-rose-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
          <div>
            <div className="font-medium text-rose-900 dark:text-rose-300">拒绝理由</div>
            <div className="mt-0.5 text-rose-800 dark:text-rose-200">{proposal.reviewNote}</div>
          </div>
        </div>
      )}

      {/* 合并信息 */}
      {proposal.status === "merged" && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-800/40 dark:bg-violet-950/30">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
          <div>
            <div className="font-medium text-violet-900 dark:text-violet-300">已合并</div>
            <div className="mt-0.5 text-violet-800 dark:text-violet-200">
              {proposal.mergedAt && `${new Date(proposal.mergedAt).toLocaleString("zh-CN")} 合并`}
              {proposal.reviewNote && ` · 审核备注: ${proposal.reviewNote}`}
            </div>
            {proposal.mergedRevisionId && (
              <div className="mt-1">
                <Link
                  href={`/courses/${proposal.courseSlug}/${proposal.chapterSlug}/`}
                  className="inline-flex items-center gap-1 text-violet-700 hover:underline dark:text-violet-300"
                >
                  <Eye className="h-3.5 w-3.5" />
                  查看已更新的章节
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 冲突警告 */}
      {conflictData && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800/40 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-amber-900 dark:text-amber-300">检测到冲突</div>
            <div className="mt-0.5 text-amber-800 dark:text-amber-200">
              当前内容跟作者提案时基于的"基准"内容不一致, 说明中间有别人改动过。
              请仔细查看 diff, 决定是否强制合并 (可能会覆盖别人的修改)。
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => handleMerge(true)}
                disabled={busy}
                className="gap-1.5"
              >
                <GitMerge className="h-4 w-4" />
                强制合并 (覆盖)
              </Button>
              <Link
                href={`/admin/courses/${proposal.courseSlug}/chapters/${proposal.chapterSlug}/`}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3.5 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-800/50 dark:bg-neutral-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
              >
                <History className="h-4 w-4" />
                查看修订历史
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Diff */}
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          变更对比
        </h2>
        <DiffViewer
          oldText={proposal.baseSnapshot}
          newText={proposal.proposedBody}
          title={proposal.chapterSlug ? `${proposal.chapterSlug}.mdx` : `${proposal.courseSlug}`}
        />
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mb-3 flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 操作栏 */}
      {(canReview || canWithdraw) && !conflictData && (
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 sm:-mx-6 sm:px-6">
          {/* 审核备注 (admin 才有) */}
          {canReview && (proposal.status === "pending" || proposal.status === "approved") && (
            <div className="flex-1 min-w-[200px]">
              <input
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="可选: 审核备注 (拒绝时必填)"
                className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
              />
            </div>
          )}

          {/* 作者撤回 */}
          {canWithdraw && (
            <Button
              variant="ghost"
              onClick={handleWithdraw}
              disabled={busy}
              className="gap-1.5"
            >
              <Undo2 className="h-4 w-4" />
              撤回提案
            </Button>
          )}

          {/* Admin 审核操作 */}
          {canReview && (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowRejectDialog(true)}
                disabled={busy}
                className="gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                拒绝
              </Button>
              <Button
                onClick={() => setShowMergeDialog(true)}
                disabled={busy}
                className="gap-1.5"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
                合并修改
              </Button>
            </>
          )}
        </div>
      )}

      {/* 拒绝原因弹窗 */}
      <ConfirmDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={async () => {
          if (!reviewNote.trim()) {
            setError("拒绝时必须填写理由");
            return;
          }
          await handleReject(reviewNote);
        }}
        title="拒绝这个提案?"
        description={
          <div>
            <p>作者 <strong>{proposal.author.displayName || proposal.author.email}</strong> 会收到通知。</p>
            <p className="mt-2 text-rose-700 dark:text-rose-400">拒绝理由会作为站内信发给作者, 请认真填写。</p>
          </div>
        }
        confirmLabel="确认拒绝"
        variant="danger"
      />

      {/* 合并确认弹窗 */}
      <ConfirmDialog
        open={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
        onConfirm={() => handleMerge(false)}
        title="合并这个提案?"
        description={
          <div className="space-y-2">
            <p>
              将会把 <strong>{proposal.author.displayName || proposal.author.email}</strong> 的修改写入课程, 并创建一条 ContentRevision 快照。
            </p>
            <p>作者会收到一封感谢站内信。</p>
            {reviewNote && (
              <p className="rounded bg-amber-50 px-2 py-1 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                备注: {reviewNote}
              </p>
            )}
          </div>
        }
        confirmLabel="确认合并"
        variant="info"
      />
    </div>
  );
}
