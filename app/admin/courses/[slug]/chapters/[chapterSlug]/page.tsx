"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, Save, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MDXEditor } from "@/components/admin/MDXEditor";
import { MDXPreview } from "@/components/admin/MDXPreview";

interface ChapterMeta {
  slug: string;
  title: string;
  description: string;
  duration: string;
}

export default function ChapterEditPage({
  params,
}: {
  params: { slug: string; chapterSlug: string };
}) {
  const [meta, setMeta] = useState<ChapterMeta | null>(null);
  const [body, setBody] = useState<string>("");
  const [originalBody, setOriginalBody] = useState<string>("");
  const [hasOverride, setHasOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [mode, setMode] = useState<"split" | "edit" | "preview">("split");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/chapters/${params.slug}/${params.chapterSlug}/`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setMeta(data.data.meta);
      setBody(data.data.content);
      setOriginalBody(data.data.content);
      setHasOverride(data.data.hasOverride);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug, params.chapterSlug]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/chapters/${params.slug}/${params.chapterSlug}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ body }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      setHasOverride(true);
      setOriginalBody(body);
      setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (
      !confirm(
        "确定要删除该章节的覆盖吗? 这会回到仓库里的 MDX 文件 (你当前的编辑会丢失)。"
      )
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/chapters/${params.slug}/${params.chapterSlug}/`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "重置失败");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = body !== originalBody;

  if (loading) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error && !meta) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!meta) return null;

  return (
    <div className="container py-6 sm:py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/admin" className="hover:text-primary-700 dark:hover:text-primary-300">
          管理
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/admin/courses/${params.slug}/`}
          className="hover:text-primary-700 dark:hover:text-primary-300"
        >
          课程
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-900 dark:text-neutral-50 line-clamp-1">
          {meta.title}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            <Edit3 className="mr-1.5 inline h-5 w-5 text-amber-500" />
            {meta.title}
          </h1>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {meta.description}
            {hasOverride && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
                <Edit3 className="h-3 w-3" />
                已编辑
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${params.slug}/${params.chapterSlug}/`}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
            target="_blank"
          >
            <Eye className="h-3.5 w-3.5" />
            打开公开页
          </Link>
          {hasOverride && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800/40 dark:bg-neutral-900 dark:text-red-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重置
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 模式切换 */}
      <div className="mb-3 inline-flex rounded-md border border-neutral-200 bg-white p-1 text-xs dark:border-neutral-800 dark:bg-neutral-900">
        {(["split", "edit", "preview"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded px-3 py-1 transition ${
              mode === m
                ? "bg-primary-600 text-white"
                : "text-neutral-600 hover:text-primary-600 dark:text-neutral-400"
            }`}
          >
            {m === "split" ? "分屏" : m === "edit" ? "只编辑" : "只预览"}
          </button>
        ))}
      </div>

      {/* 分屏布局 */}
      <div
        className={`grid gap-4 ${
          mode === "split"
            ? "lg:grid-cols-2"
            : mode === "edit"
            ? "grid-cols-1"
            : "grid-cols-1"
        }`}
      >
        {mode !== "preview" && (
          <div className="min-w-0">
            <div className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
              MDX 源 ({body.length.toLocaleString()} 字符)
            </div>
            <MDXEditor
              value={body}
              onChange={setBody}
              draftKey={`chapter-${params.slug}-${params.chapterSlug}`}
              minHeight="calc(100vh - 320px)"
            />
          </div>
        )}
        {mode !== "edit" && (
          <div>
            <div className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">实时预览</div>
            <div className="max-h-[calc(100vh-320px)] min-h-[500px] overflow-y-auto rounded-md">
              <MDXPreview source={body} />
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="mt-4 flex items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="gap-1.5"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isDirty ? "保存修改" : "未修改"}
        </Button>
        {savedAt && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            已保存 · {savedAt}
          </span>
        )}
        {isDirty && !saving && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            有未保存的改动
          </span>
        )}
        <div className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
          支持组件: <code>Callout</code> · <code>CodeBlock</code> · <code>M</code> ·{" "}
          <code>Quiz</code> · 6 个交互组件
        </div>
      </div>
    </div>
  );
}
