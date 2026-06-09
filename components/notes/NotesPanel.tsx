"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Edit3,
  Loader2,
  NotebookPen,
  Plus,
  Save,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  highlightedText: string;
  content: string;
  color: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const COLORS: Record<string, { label: string; classes: string }> = {
  yellow: {
    label: "黄色",
    classes: "bg-yellow-100 text-yellow-900 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:ring-yellow-800/50",
  },
  red: {
    label: "红色",
    classes: "bg-rose-100 text-rose-900 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800/50",
  },
  green: {
    label: "绿色",
    classes: "bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800/50",
  },
  blue: {
    label: "蓝色",
    classes: "bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:ring-sky-800/50",
  },
};

export function NotesPanel({
  courseSlug,
  chapterSlug,
}: {
  courseSlug: string;
  chapterSlug: string;
}) {
  const { user, ready } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState<"yellow" | "red" | "green" | "blue">("yellow");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/notes/?courseSlug=${courseSlug}&chapterSlug=${chapterSlug}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setNotes(data.data.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, [courseSlug, chapterSlug, user]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  async function handleSave() {
    if (!draft.trim()) {
      setError("请输入笔记内容");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/notes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseSlug,
          chapterSlug,
          highlightedText: "", // 简化: 不依赖高亮选区
          content: draft,
          color: draftColor,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      setDraft("");
      setEditing(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这条笔记?")) return;
    try {
      const res = await fetch(`/api/notes/${id}/`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) await load();
    } catch (e) {
      // ignore
    }
  }

  async function handleChangeColor(id: string, color: string) {
    try {
      const res = await fetch(`/api/notes/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ color }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, color: data.data.note.color } : n))
        );
      }
    } catch (e) {
      // ignore
    }
  }

  if (!ready) {
    return null;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          <NotebookPen className="h-4 w-4 text-primary-600" />
          我的笔记
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          <a href="/login" className="text-primary-700 hover:underline">登录</a> 后可在本章添加笔记。
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          <NotebookPen className="h-4 w-4 text-primary-600" />
          我的笔记
          <span className="text-xs text-neutral-500">({notes.length})</span>
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 transition hover:border-primary-300 hover:text-primary-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <Plus className="h-3 w-3" />
            新建
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {editing && (
        <div className="mb-3 rounded-md border border-primary-200 bg-primary-50/30 p-3 dark:border-primary-800/50 dark:bg-primary-950/20">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="写下你的学习笔记..."
            maxLength={2000}
            rows={3}
            className="w-full resize-none rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
            autoFocus
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-500">颜色:</span>
              {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map((c) => (
                <button
                  key={c}
                  onClick={() => setDraftColor(c as "yellow" | "red" | "green" | "blue")}
                  className={cn(
                    "h-4 w-4 rounded-full border-2 transition",
                    COLORS[c].classes,
                    draftColor === c ? "ring-2 ring-primary-500" : "opacity-60 hover:opacity-100"
                  )}
                  title={COLORS[c].label}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft("");
                }}
                className="rounded px-2 py-1 text-[11px] text-neutral-500 hover:text-neutral-700"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !draft.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-neutral-500">
          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          加载笔记...
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          还没有笔记, 点击右上'新建'开始
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => {
            const colorMeta = (COLORS as any)[n.color] ?? COLORS.yellow;
            return (
              <li
                key={n.id}
                className={cn(
                  "group relative rounded-md p-2.5 text-xs ring-1",
                  colorMeta.classes
                )}
              >
                {n.highlightedText && (
                  <div className="mb-1.5 truncate text-[10px] italic opacity-75">
                    ❝ {n.highlightedText.slice(0, 80)}
                    {n.highlightedText.length > 80 ? "..." : ""} ❞
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{n.content}</div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-60">
                  <span>
                    {new Date(n.createdAt).toLocaleDateString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    {(["yellow", "red", "green", "blue"] as const).map((c: "yellow" | "red" | "green" | "blue") => (
                      <button
                        key={c}
                        onClick={() => handleChangeColor(n.id, c)}
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          COLORS[c].classes
                        )}
                        title={COLORS[c].label}
                      />
                    ))}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="ml-1 rounded p-0.5 hover:bg-rose-200 dark:hover:bg-rose-900/40"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-[10px] text-neutral-400">
        💡 提示: 选中文本时, 浏览器自带的笔记高亮功能也能用
      </p>
    </div>
  );
}
