"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  XCircle,
  GitMerge,
  GitPullRequestArrow,
  Info,
  Settings,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  meta: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: typeof Bell; classes: string; label: string }> = {
  proposal_merged: {
    icon: GitMerge,
    classes: "bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:ring-violet-800/50",
    label: "提案已合并",
  },
  proposal_rejected: {
    icon: XCircle,
    classes: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/50",
    label: "提案被拒绝",
  },
  proposal_approved: {
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/50",
    label: "提案已批准",
  },
  proposal_submitted: {
    icon: GitPullRequestArrow,
    classes: "bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/50",
    label: "新提案",
  },
  system: {
    icon: Info,
    classes: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-300 dark:ring-neutral-700",
    label: "系统通知",
  },
};

interface NotificationCenterProps {
  /** 显示模式: 'bell' = 顶部铃铛(只显示小红点 + dropdown); 'page' = 完整页面 */
  mode: "bell" | "page";
}

export function NotificationCenter({ mode }: NotificationCenterProps) {
  const { user, ready } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications/?limit=50`, { credentials: "include" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setNotifications(data.data.notifications);
      setUnread(data.data.unread);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user) load();
    // 每 30 秒自动拉一次未读数
    const interval = setInterval(() => {
      if (user) {
        fetch("/api/notifications/?limit=1", { credentials: "include" })
          .then((r) => r.json())
          .then((d) => {
            if (d.ok) setUnread(d.data.unread);
          })
          .catch(() => {});
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [ready, user, load]);

  // 点外部关闭 (只 bell 模式)
  useEffect(() => {
    if (mode !== "bell" || !open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notif-bell]") && !target.closest("[data-notif-dropdown]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, mode]);

  async function handleMarkRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch (e) {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      const res = await fetch(`/api/notifications/mark-all-read/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        const now = new Date().toISOString();
        setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
        setUnread(0);
      }
    } catch (e) {
      // ignore
    }
  }

  if (!user) return null;

  // === Bell mode (header bell with dropdown) ===
  if (mode === "bell") {
    return (
      <div className="relative" data-notif-bell>
        <button
          onClick={() => {
            setOpen(!open);
            if (!open) load();
          }}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
          aria-label="通知"
        >
          {unread > 0 ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-950">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div
            data-notif-dropdown
            className="absolute right-0 top-11 z-50 w-[360px] max-h-[480px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/60">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                通知 {unread > 0 && <span className="text-rose-500">({unread})</span>}
              </h3>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <CheckCheck className="h-3 w-3" />
                  全部已读
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  暂无通知
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {notifications.slice(0, 8).map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.system;
                    const Icon = meta.icon;
                    const isUnread = !n.readAt;
                    return (
                      <li key={n.id}>
                        <a
                          href={n.link ?? "#"}
                          onClick={(e) => {
                            if (n.link) {
                              // 内部链接: 用路由
                              e.preventDefault();
                              if (isUnread) handleMarkRead(n.id);
                              setOpen(false);
                              window.location.href = n.link;
                            } else {
                              e.preventDefault();
                              if (isUnread) handleMarkRead(n.id);
                            }
                          }}
                          className={cn(
                            "flex items-start gap-2 px-3 py-2.5 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                            isUnread && "bg-primary-50/40 dark:bg-primary-950/20"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full ring-1",
                              meta.classes
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <div className={cn("text-[12.5px] leading-snug", isUnread ? "font-semibold text-neutral-900 dark:text-neutral-50" : "font-medium text-neutral-700 dark:text-neutral-200")}>
                                  {n.title}
                                </div>
                                <div className="mt-0.5 line-clamp-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                                  {n.body}
                                </div>
                                <div className="mt-1 text-[10px] text-neutral-400">
                                  {new Date(n.createdAt).toLocaleString("zh-CN", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                              {isUnread && (
                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" />
                              )}
                            </div>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/60">
              <Link
                href="/notifications/"
                onClick={() => setOpen(false)}
                className="block text-center text-[11px] text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                查看全部 →
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === Page mode (full notification center) ===
  return (
    <div className="container py-10 sm:py-12">
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300"
        >
          ← 返回首页
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
            <BellRing className="h-3 w-3" />
            站内通知
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">通知中心</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            提案审核、合并、感谢信等消息都会出现在这里。
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-200 bg-primary-50 px-3.5 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-950/50"
          >
            <CheckCheck className="h-4 w-4" />
            全部标记已读
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="container py-12">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
          <Sparkles className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            还没有任何通知
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            const Icon = meta.icon;
            const isUnread = !n.readAt;
            const Content = (
              <div className="flex items-start gap-3 p-4">
                <span
                  className={cn(
                    "mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full ring-1",
                    meta.classes
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={cn(
                        "text-sm leading-snug",
                        isUnread ? "font-semibold text-neutral-900 dark:text-neutral-50" : "font-medium text-neutral-700 dark:text-neutral-200"
                      )}
                    >
                      {n.title}
                    </h3>
                    {isUnread && (
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                    {n.body}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-400">
                    <span>{new Date(n.createdAt).toLocaleString("zh-CN")}</span>
                    <span>· {meta.label}</span>
                  </div>
                </div>
                {isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleMarkRead(n.id);
                    }}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    title="标记已读"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
            return (
              <li
                key={n.id}
                className={cn(
                  "overflow-hidden rounded-xl border border-neutral-200 bg-white transition dark:border-neutral-800 dark:bg-neutral-900",
                  isUnread && "ring-1 ring-primary-200 dark:ring-primary-800/50"
                )}
              >
                {n.link ? (
                  <Link
                    href={n.link}
                    onClick={() => isUnread && handleMarkRead(n.id)}
                    className="block transition hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                  >
                    {Content}
                  </Link>
                ) : (
                  Content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
