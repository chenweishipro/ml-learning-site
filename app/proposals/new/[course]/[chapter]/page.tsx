"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitPullRequestArrow,
  Loader2,
  Send,
  Eye,
  Code,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MDXEditor } from "@/components/admin/MDXEditor";
import { MDXPreview } from "@/components/admin/MDXPreview";
import { DiffViewer } from "@/components/proposals/DiffViewer";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

interface ChapterMeta {
  slug: string;
  title: string;
  description: string;
  duration: string;
}

interface ChapterData {
  meta: ChapterMeta;
  content: string;
  hasOverride: boolean;
}

export default function NewProposalPage({
  params,
}: {
  params: { course: string; chapter: string };
}) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [baseSnapshot, setBaseSnapshot] = useState<string>("");
  const [proposedBody, setProposedBody] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"split" | "edit" | "preview" | "diff">("diff");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 拿章节当前内容
      const chapRes = await fetch(
        `/api/admin/chapters/${params.course}/${params.chapter}/`,
        { credentials: "include" }
      );
      const chapData = await chapRes.json();
      if (!chapData.ok) {
        setError(chapData.error ?? "加载失败");
        return;
      }
      setChapter(chapData.data);
      setBaseSnapshot(chapData.data.content);
      setProposedBody(chapData.data.content); // 预填当前内容, 用户在此基础上修改

      // 2. 拿课程标题 (从 public 课程页拿也行, 简单点用 _index 文件)
      try {
        const c = await import(`@/content/courses/${params.course}/_index`);
        // @ts-ignore
        setCourseTitle(c?.default?.title ?? params.course);
      } catch {
        setCourseTitle(params.course);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, [params.course, params.chapter]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  // 未登录 → 跳到登录
  useEffect(() => {
    if (ready && !user) {
      router.push(`/login/?next=/proposals/new/${params.course}/${params.chapter}/`);
    }
  }, [ready, user, router, params.course, params.chapter]);

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

  if (error && !chapter) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
        <Link href={`/courses/${params.course}/${params.chapter}/`} className="mt-4 inline-block text-sm text-primary-700 hover:underline">
          ← 返回章节
        </Link>
      </div>
    );
  }

  if (!chapter) return null;

  const hasChanges = proposedBody !== baseSnapshot;

  async function handleSubmit() {
    if (!title.trim()) {
      setError("请填写提案标题");
      return;
    }
    if (!description.trim()) {
      setError("请填写修改说明");
      return;
    }
    if (!hasChanges) {
      setError("内容未修改, 无需提交");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scope: "chapter",
          courseSlug: params.course,
          chapterSlug: params.chapter,
          title,
          description,
          proposedBody,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "提交失败");
        return;
      }
      setSubmitted(data.data.id);
      setTimeout(() => {
        router.push(`/proposals/${data.data.id}/`);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-6 sm:py-8">
      {/* 面包屑 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={`/courses/${params.course}/${params.chapter}/`}
          className="inline-flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回章节
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-900 dark:text-neutral-50">提议修改</span>
      </div>

      <div className="mb-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
          <GitPullRequestArrow className="h-3 w-3" />
          提议修改 · {courseTitle || params.course} / {chapter.meta.title}
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">提出修改建议</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          像 Git 一样: 写好改动, 提交后由管理员审核合并。合并后会通知你并致谢。
        </p>
      </div>

      {/* 提案信息 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            提案标题 <span className="text-rose-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="简短描述这次修改的目的, 例如: '修正第二章公式错误'"
            maxLength={200}
            className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
          <div className="mt-1 text-[11px] text-neutral-500">{title.length} / 200</div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            修改说明 <span className="text-rose-500">*</span>
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="为什么做这个修改? 比如: '原公式中分子分母写反了'"
            maxLength={2000}
            className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
          <div className="mt-1 text-[11px] text-neutral-500">{description.length} / 2000</div>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="mb-3 inline-flex rounded-md border border-neutral-200 bg-white p-1 text-xs dark:border-neutral-800 dark:bg-neutral-900">
        {(
          [
            { v: "diff", label: "差异对比", icon: GitPullRequestArrow },
            { v: "edit", label: "只编辑", icon: Code },
            { v: "split", label: "编辑+预览", icon: Save },
            { v: "preview", label: "只预览", icon: Eye },
          ] as const
        ).map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.v}
              onClick={() => setMode(m.v)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-3 py-1 transition",
                mode === m.v
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:text-primary-600 dark:text-neutral-400"
              )}
            >
              <Icon className="h-3 w-3" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* 编辑器 / 预览 / 差异对比 */}
      <div
        className={cn(
          "grid gap-4",
          mode === "split" && "lg:grid-cols-2",
          mode === "edit" && "grid-cols-1",
          mode === "preview" && "grid-cols-1",
          mode === "diff" && "grid-cols-1"
        )}
      >
        {mode === "diff" && (
          <DiffViewer
            oldText={baseSnapshot}
            newText={proposedBody}
            title={`${params.chapter}.mdx`}
          />
        )}
        {mode !== "diff" && mode !== "preview" && (
          <div className="min-w-0">
            <div className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
              MDX 源 ({proposedBody.length.toLocaleString()} 字符)
            </div>
            <MDXEditor
              value={proposedBody}
              onChange={setProposedBody}
              draftKey={`proposal-${params.course}-${params.chapter}-${user.id}`}
              minHeight="calc(100vh - 380px)"
            />
          </div>
        )}
        {mode === "split" && (
          <div>
            <div className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">实时预览</div>
            <div className="max-h-[calc(100vh-380px)] min-h-[500px] overflow-y-auto rounded-md">
              <MDXPreview source={proposedBody} />
            </div>
          </div>
        )}
        {mode === "preview" && (
          <div>
            <div className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">实时预览</div>
            <div className="max-h-[calc(100vh-380px)] min-h-[500px] overflow-y-auto rounded-md">
              <MDXPreview source={proposedBody} />
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      {error && (
        <div className="mt-3 flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {submitted && (
        <div className="mt-3 flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          提案已提交! 正在跳转到详情页...
        </div>
      )}

      {/* 操作栏 */}
      <div className="sticky bottom-0 mt-6 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 sm:-mx-6 sm:px-6">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {hasChanges ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              已有改动, 可提交
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              未做修改
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push(`/courses/${params.course}/${params.chapter}/`)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !hasChanges || submitted !== null}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            提交提案
          </Button>
        </div>
      </div>
    </div>
  );
}
