"use client";

import { useEffect, useState, useCallback } from "react";
import { History, RotateCcw, Loader2, ChevronDown, ChevronUp, User, Clock, X, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Scope = "course" | "chapter";

interface RevisionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

interface Revision {
  id: string;
  scope: string;
  courseSlug: string;
  chapterSlug: string | null;
  body: string;
  summary: string | null;
  source: string;
  restoredFrom: string | null;
  createdAt: string;
  userId: string;
  user: RevisionUser;
}

interface RevisionsPanelProps {
  scope: Scope;
  courseSlug: string;
  chapterSlug?: string;
  /** 触发刷新: 当保存成功后调用, 重新拉取列表 */
  refreshKey?: number;
  /** 当前内容(章节 body 或课程元信息 JSON),用于回滚前的 diff 提示 */
  currentBodyPreview?: string;
  /** 课程 scope: 用于解析 body 拿到标题等做摘要 */
  onRollbackSuccess?: () => void;
}

export function RevisionsPanel({
  scope,
  courseSlug,
  chapterSlug,
  refreshKey = 0,
  onRollbackSuccess,
}: RevisionsPanelProps) {
  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingId, setRollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewingRev, setPreviewingRev] = useState<Revision | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        scope,
        courseSlug,
        limit: "50",
      });
      if (chapterSlug) params.set("chapterSlug", chapterSlug);
      const res = await fetch(`/api/admin/revisions/?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setRevisions(data.data.revisions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, [scope, courseSlug, chapterSlug]);

  useEffect(() => {
    if (open) load();
  }, [open, load, refreshKey]);

  async function handleRollback(rev: Revision) {
    const confirmed = confirm(
      `确定要回滚到这次版本吗?\n\n时间: ${new Date(rev.createdAt).toLocaleString("zh-CN")}\n操作人: ${rev.user.displayName || rev.user.email}\n来源: ${rev.source === "rollback" ? "上一次回滚" : rev.source === "save" ? "保存" : "初始"}\n\n回滚前的当前内容会自动保存为新的快照, 不会丢失。`
    );
    if (!confirmed) return;

    setRollingId(rev.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/revisions/${rev.id}/rollback/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "回滚失败");
        return;
      }
      await load();
      onRollbackSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setRollingId(null);
    }
  }

  function formatSummary(rev: Revision): string {
    if (rev.summary) return rev.summary;
    if (rev.scope === "chapter") {
      // 提取第一行 H1/H2 作为摘要
      const firstHeading = rev.body.split("\n").find((l) => /^#+\s/.test(l));
      if (firstHeading) return firstHeading.replace(/^#+\s*/, "").slice(0, 50);
      return rev.body.slice(0, 50).replace(/\n/g, " ");
    }
    return "(无摘要)";
  }

  function getSourceBadge(source: string) {
    const map: Record<string, { label: string; className: string }> = {
      save: { label: "保存", className: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800" },
      rollback: { label: "回滚", className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800" },
      initial: { label: "初始", className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800" },
    };
    return map[source] ?? { label: source, className: "bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700" };
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            修订历史
          </span>
          {revisions.length > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {revisions.length}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          {loading && (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-neutral-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              加载中...
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {!loading && !error && revisions.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
              还没有修订记录。保存后会自动生成快照。
            </div>
          )}

          {!loading && revisions.length > 0 && (
            <ul className="max-h-[420px] divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800">
              {revisions.map((rev) => {
                const badge = getSourceBadge(rev.source);
                return (
                  <li key={rev.id} className="px-4 py-3 transition hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1", badge.className)}>
                            {badge.label}
                          </span>
                          <span className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-50">
                            {formatSummary(rev)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(rev.createdAt).toLocaleString("zh-CN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {rev.user.displayName || rev.user.email}
                          </span>
                        </div>
                        {rev.summary && rev.scope === "course" && (
                          <div className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-1">
                            {rev.summary}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1">
                        <button
                          onClick={() => setPreviewingRev(rev)}
                          className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                          title="查看快照内容"
                          aria-label="查看快照"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRollback(rev)}
                          disabled={rollingId === rev.id}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                          title="把当前内容回滚到这次版本"
                        >
                          {rollingId === rev.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          回滚
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {previewingRev && (
        <RevisionPreview
          revision={previewingRev}
          onClose={() => setPreviewingRev(null)}
        />
      )}
    </div>
  );
}

function RevisionPreview({
  revision,
  onClose,
}: {
  revision: Revision;
  onClose: () => void;
}) {
  // 课程快照: 解析 JSON, 展示元信息
  // 章节快照: 展示 MDX 内容
  const isCourse = revision.scope === "course";
  let courseData: any = null;
  let mdxBody = revision.body;
  if (isCourse) {
    try {
      courseData = JSON.parse(revision.body);
    } catch {
      courseData = null;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/80 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/80">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              快照预览
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {new Date(revision.createdAt).toLocaleString("zh-CN")} · {revision.user.displayName || revision.user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-100px)] overflow-y-auto p-4">
          {isCourse && courseData ? (
            <div className="space-y-3">
              <Field label="标题" value={courseData.title ?? "(未设置)"} />
              <Field label="简介" value={courseData.description ?? "(未设置)"} />
              <Field label="级别" value={courseData.level ?? "(未设置)"} />
              <Field label="时长" value={courseData.duration ?? "(未设置)"} />
              <Field
                label="标签"
                value={
                  courseData.tags
                    ? (() => {
                        try {
                          return (JSON.parse(courseData.tags) as string[]).join(", ");
                        } catch {
                          return courseData.tags;
                        }
                      })()
                    : "(未设置)"
                }
              />
              {courseData.body && (
                <div>
                  <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Body</div>
                  <pre className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-800">
                    {courseData.body.slice(0, 1000)}{courseData.body.length > 1000 ? "..." : ""}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
              {mdxBody.slice(0, 5000)}
              {mdxBody.length > 5000 && (
                <div className="mt-3 text-[11px] italic text-neutral-500">
                  (省略剩余 {mdxBody.length - 5000} 字符)
                </div>
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-50">{value}</div>
    </div>
  );
}
