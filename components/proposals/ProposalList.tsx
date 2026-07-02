"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitPullRequestArrow,
  Loader2,
  Search,
  Filter,
  Eye,
  ChevronRight,
  CheckCircle2,
  XCircle,
  GitMerge,
  Undo2,
  Plus,
  Clock,
  User as UserIcon,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type Role } from "@/components/auth-provider";
import { isAdmin } from "@/lib/roles";

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
  status: "pending" | "approved" | "merged" | "rejected" | "withdrawn";
  reviewerId: string | null;
  reviewer: ProposalUser | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  mergedAt: string | null;
  mergedRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_META: Record<Proposal["status"], { label: string; classes: string; icon: typeof GitPullRequestArrow }> = {
  pending: {
    label: "等待审核",
    classes: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800/50",
    icon: GitPullRequestArrow,
  },
  approved: {
    label: "已批准",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50",
    icon: CheckCircle2,
  },
  merged: {
    label: "已合并",
    classes: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50",
    icon: GitMerge,
  },
  rejected: {
    label: "已拒绝",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
    icon: XCircle,
  },
  withdrawn: {
    label: "已撤回",
    classes: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-400 dark:ring-neutral-700",
    icon: Undo2,
  },
};

type FilterStatus = "all" | "pending" | "approved" | "merged" | "rejected" | "withdrawn";

interface ProposalListProps {
  mode: "user" | "admin";
}

export function ProposalList({ mode }: ProposalListProps) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [stats, setStats] = useState<{ pending: number; mine: number; merged: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterStatus>(mode === "admin" ? "pending" : "all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      params.set("limit", "100");
      const res = await fetch(`/api/proposals/?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setProposals(data.data.proposals);
      setStats(data.data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    }
  }, [status]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  // 过滤 + 搜索
  const filtered = useMemo(() => {
    if (!proposals) return [];
    const q = query.trim().toLowerCase();
    if (!q) return proposals;
    return proposals.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.courseSlug.toLowerCase().includes(q) ||
        (p.chapterSlug ?? "").toLowerCase().includes(q) ||
        (p.author.displayName ?? "").toLowerCase().includes(q) ||
        p.author.email.toLowerCase().includes(q)
    );
  }, [proposals, query]);

  if (!ready) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
          请先登录后查看提案。
        </div>
      </div>
    );
  }

  // Admin 模式: 必须是 admin
  if (mode === "admin" && !isAdmin(user.role as Role)) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-800/40 dark:bg-rose-950/30">
          <h1 className="text-lg font-semibold text-rose-900 dark:text-rose-300">需要管理员权限</h1>
          <Link href="/proposals/" className="mt-4 inline-block text-sm text-primary-700 hover:underline">
            查看我的提案
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 sm:py-12">
      {/* 面包屑 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        {mode === "admin" ? (
          <>
            <Link
              href="/admin/"
              className="inline-flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              管理首页
            </Link>
            <span aria-hidden>/</span>
            <span className="text-neutral-900 dark:text-neutral-50">提案审核</span>
          </>
        ) : (
          <span className="text-neutral-900 dark:text-neutral-50">我的提案</span>
        )}
      </div>

      {/* 标题 */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span
            className={cn(
              "mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1",
              mode === "admin"
                ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50"
                : "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50"
            )}
          >
            <GitPullRequestArrow className="h-3 w-3" />
            {mode === "admin" ? "提案审核中心" : "我的提案"}
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {mode === "admin" ? "待审核内容修改" : "我提交的修改建议"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            {mode === "admin"
              ? "审阅所有用户提交的内容修改, 批准/拒绝/合并。合并后会写入课程并通知作者。"
              : "查看你提交的内容修改建议, 以及管理员的处理结果。"}
          </p>
        </div>
        {mode === "user" && (
          <Link
            href="/courses/"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            新建提案
          </Link>
        )}
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {mode === "admin" ? (
            <>
              <StatCard
                label="待审核"
                value={stats.pending}
                color="blue"
                onClick={() => setStatus(stats.pending > 0 && status === "pending" ? "all" : "pending")}
                active={status === "pending"}
              />
              <StatCard label="已合并" value={stats.merged} color="violet" onClick={() => setStatus("merged")} active={status === "merged"} />
              <StatCard label="我提交的" value={stats.mine} color="emerald" onClick={() => setStatus("all")} active={false} />
            </>
          ) : (
            <>
              <StatCard label="等待中" value={stats.mine} color="blue" onClick={() => setStatus("pending")} active={status === "pending"} />
              <StatCard label="已合并" value={stats.merged} color="violet" onClick={() => setStatus("merged")} active={status === "merged"} />
              <StatCard label="全部" value={(proposals?.length ?? 0)} color="neutral" onClick={() => setStatus("all")} active={status === "all"} />
            </>
          )}
        </div>
      )}

      {/* 工具栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题 / 描述 / 课程 / 作者..."
            className="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
        </div>
        <div className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
          {(
            [
              { v: "all", label: "全部" },
              { v: "pending", label: "待审" },
              { v: "merged", label: "已合并" },
              { v: "rejected", label: "已拒" },
              { v: "withdrawn", label: "已撤回" },
            ] as { v: FilterStatus; label: string }[]
          ).map((tab) => (
            <button
              key={tab.v}
              onClick={() => setStatus(tab.v)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition",
                status === tab.v
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 列表 */}
      {!proposals ? (
        <div className="container py-12">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {query ? "没有匹配项" : status === "all" ? "还没有任何提案" : `没有${STATUS_META[status as keyof typeof STATUS_META]?.label ?? status}的提案`}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const statusMeta = STATUS_META[p.status];
            const StatusIcon = statusMeta.icon;
            return (
              <li key={p.id}>
                <Link
                  href={`/proposals/${p.id}/`}
                  className="group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                          statusMeta.classes
                        )}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusMeta.label}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {p.scope === "chapter" ? "章节" : "课程"} · {p.courseSlug}
                        {p.chapterSlug && ` / ${p.chapterSlug}`}
                      </span>
                    </div>
                    <h3 className="truncate text-sm font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {p.author.displayName || p.author.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(p.createdAt).toLocaleString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {p.reviewer && (
                        <span className="inline-flex items-center gap-1">
                          <History className="h-3 w-3" />
                          {p.reviewer.displayName || p.reviewer.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-500 sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        共 {proposals?.length ?? 0} 条
        {query && ` · 匹配 ${filtered.length} 条`}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number;
  color: "blue" | "violet" | "emerald" | "neutral";
  onClick?: () => void;
  active?: boolean;
}) {
  const COLOR_MAP: Record<typeof color, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    neutral: "text-neutral-700 dark:text-neutral-200",
  };
  const Wrap = onClick ? "button" : "div";
  return (
    <Wrap
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-white p-4 text-left transition dark:bg-neutral-900",
        onClick && "cursor-pointer hover:border-primary-300 dark:hover:border-primary-700",
        active ? "border-primary-400 ring-2 ring-primary-200 dark:border-primary-700 dark:ring-primary-800/50" : "border-neutral-200 dark:border-neutral-800"
      )}
    >
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold tabular-nums", COLOR_MAP[color])}>
        {value}
      </div>
    </Wrap>
  );
}
