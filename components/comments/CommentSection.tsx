"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CornerDownRight,
  Heart,
  Loader2,
  MessageSquare,
  Send,
  ShieldAlert,
  ThumbsUp,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth, type Role } from "@/components/auth-provider";
import { isAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";

type CommentScope = "course" | "chapter";

interface CommentUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

interface Comment {
  id: string;
  scope: string;
  courseSlug: string;
  chapterSlug: string | null;
  parentId: string | null;
  authorId: string;
  author: CommentUser;
  body: string;
  status: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  _count: { likes: number };
}

interface CommentSectionProps {
  scope: CommentScope;
  courseSlug: string;
  chapterSlug?: string;
  /** 标题 (可选) */
  title?: string;
}

const ROLE_META: Record<string, { label: string; classes: string }> = {
  user: {
    label: "用户",
    classes: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  },
  admin: {
    label: "管理员",
    classes: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
  },
  superadmin: {
    label: "超管",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "刚刚";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export function CommentSection({ scope, courseSlug, chapterSlug, title = "讨论区" }: CommentSectionProps) {
  const { user, ready } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdminUser = user ? isAdmin(user.role as Role) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        scope,
        courseSlug,
        ...(chapterSlug ? { chapterSlug } : {}),
      });
      const res = await fetch(`/api/comments/?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setComments(data.data.comments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, [scope, courseSlug, chapterSlug]);

  useEffect(() => {
    load();
  }, [load]);

  // 把评论组织成树
  const tree = useMemo(() => {
    const top: Comment[] = [];
    const byId = new Map<string, Comment & { children: Comment[] }>();
    for (const c of comments) {
      byId.set(c.id, { ...c, children: [] });
    }
    for (const c of byId.values()) {
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId)!.children.push(c);
      } else {
        top.push(c);
      }
    }
    // 按时间倒序
    top.reverse();
    for (const c of byId.values()) c.children.reverse();
    return top;
  }, [comments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scope,
          courseSlug,
          chapterSlug,
          body: draft,
          parentId: replyTo?.id,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "发表失败");
        return;
      }
      setDraft("");
      setReplyTo(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这条评论?")) return;
    try {
      const res = await fetch(`/api/comments/${id}/`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    }
  }

  async function handleLike(id: string) {
    try {
      const res = await fetch(`/api/comments/${id}/?action=like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        // 局部更新点赞数
        setComments((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, likeCount: data.data.likeCount } : c
          )
        );
      }
    } catch (e) {
      // ignore
    }
  }

  async function handleHide(id: string) {
    if (!confirm("确定要隐藏这条评论吗? (仅管理员可见, 普通用户看不到)")) return;
    try {
      const res = await fetch(`/api/comments/${id}/?action=hide`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) await load();
    } catch (e) {
      // ignore
    }
  }

  const stats = useMemo(() => {
    const total = comments.length;
    const byUser = new Map<string, number>();
    for (const c of comments) {
      if (c.status === "published") {
        byUser.set(c.authorId, (byUser.get(c.authorId) ?? 0) + 1);
      }
    }
    return { total, uniqueUsers: byUser.size };
  }, [comments]);

  return (
    <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          {title}
          <span className="text-xs text-neutral-500">({stats.total})</span>
        </h2>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 输入区 */}
      {ready && user ? (
        <form onSubmit={handleSubmit} className="mb-5">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-md border border-primary-200 bg-primary-50/40 px-3 py-2 text-xs text-primary-800 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300">
              <span className="inline-flex items-center gap-1.5">
                <CornerDownRight className="h-3 w-3" />
                回复 @{replyTo.author.displayName ?? replyTo.author.email}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="rounded p-0.5 hover:bg-primary-100 dark:hover:bg-primary-900/40"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-start gap-2">
            <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-white">
              {(user.displayName?.[0] ?? user.email[0] ?? "U").toUpperCase()}
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={replyTo ? "写下你的回复..." : "说点什么吧... (支持 Markdown · 2k 字内)"}
              maxLength={2000}
              rows={3}
              className="flex-1 resize-none rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500">{draft.length} / 2000</span>
            <button
              type="submit"
              disabled={submitting || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {replyTo ? "回复" : "发表"}
            </button>
          </div>
        </form>
      ) : ready ? (
        <div className="mb-5 rounded-md border border-dashed border-neutral-300 p-3 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          <Link href="/login" className="text-primary-700 hover:underline">
            登录
          </Link>{" "}
          后参与讨论
        </div>
      ) : null}

      {/* 评论列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          加载评论中...
        </div>
      ) : tree.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          还没有讨论, 来抢沙发吧 🎉
        </div>
      ) : (
        <ul className="space-y-4">
          {tree.map((c) => (
            <CommentItem
              key={c.id}
              comment={c as any}
              currentUserId={user?.id}
              isAdminUser={isAdminUser}
              onReply={setReplyTo}
              onDelete={handleDelete}
              onLike={handleLike}
              onHide={handleHide}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  isAdminUser,
  onReply,
  onDelete,
  onLike,
  onHide,
}: {
  comment: Comment & { children: Comment[] };
  currentUserId?: string;
  isAdminUser: boolean;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onHide: (id: string) => void;
}) {
  const isOwn = currentUserId === comment.authorId;
  const role = comment.author.role as Role;
  const roleMeta = ROLE_META[role] ?? ROLE_META.user;
  const isDeleted = comment.status === "deleted";
  const isHidden = comment.status === "hidden";

  return (
    <li className="rounded-lg border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-white">
            {(comment.author.displayName?.[0] ?? comment.author.email[0] ?? "U").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {comment.author.displayName ?? comment.author.email.split("@")[0]}
              </span>
              {role !== "user" && (
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium ring-1", roleMeta.classes)}>
                  {roleMeta.label}
                </span>
              )}
              <span className="text-[11px] text-neutral-400">{timeAgo(comment.createdAt)}</span>
              {isHidden && (
                <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50">
                  已隐藏
                </span>
              )}
            </div>
            <div
              className={cn(
                "mt-1.5 whitespace-pre-wrap text-sm leading-relaxed",
                isDeleted ? "italic text-neutral-400 dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"
              )}
            >
              {comment.body}
            </div>
            {!isDeleted && (
              <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-500">
                <button
                  onClick={() => onLike(comment.id)}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                >
                  <Heart className="h-3 w-3" />
                  {comment.likeCount}
                </button>
                {currentUserId && (
                  <button
                    onClick={() => onReply(comment)}
                    className="rounded px-1.5 py-0.5 transition hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-950/30 dark:hover:text-primary-400"
                  >
                    回复
                  </button>
                )}
                {(isOwn || isAdminUser) && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="rounded px-1.5 py-0.5 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                  >
                    删除
                  </button>
                )}
                {isAdminUser && !isOwn && comment.status === "published" && (
                  <button
                    onClick={() => onHide(comment.id)}
                    className="rounded px-1.5 py-0.5 transition hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                  >
                    隐藏
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 回复列表 */}
      {comment.children.length > 0 && (
        <ul className="space-y-2 border-t border-neutral-100 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child as any}
              currentUserId={currentUserId}
              isAdminUser={isAdminUser}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              onHide={onHide}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
