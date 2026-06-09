"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, Tag, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";


export default function AskQuestionPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [chapterSlug, setChapterSlug] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allCourses, setAllCourses] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/courses/").then(r => r.json()).then(d => {
      if (d.ok) setAllCourses(d.data.courses);
    });
  }, []);

  useEffect(() => {
    if (ready && !user) router.push("/login/?next=/qa/new/");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t)) return;
    if (tags.length >= 5) {
      setError("最多 5 个标签");
      return;
    }
    setTags([...tags, t]);
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("标题和内容必填");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/questions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          body,
          courseSlug: courseSlug || undefined,
          chapterSlug: chapterSlug || undefined,
          tags,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "提交失败");
        return;
      }
      router.push(`/qa/${data.data.question.id}/`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  const course = courseSlug ? allCourses.find((c) => c.slug === courseSlug) : null;

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/qa/" className="inline-flex items-center gap-1 hover:text-primary-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          返回问答
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">提个问题</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        描述清楚问题, 社区成员 + AI 会帮你解答。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            标题 <span className="text-rose-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="一句话说清楚你的问题"
            maxLength={200}
            className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            详细描述 <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="详细说明你的问题, 包括: 你尝试过什么、遇到的具体错误、相关代码/数据等"
            maxLength={10000}
            rows={10}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
          <div className="mt-1 text-[11px] text-neutral-500">{body.length} / 10000</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              关联课程 (可选)
            </label>
            <select
              value={courseSlug}
              onChange={(e) => {
                setCourseSlug(e.target.value);
                setChapterSlug("");
              }}
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">不关联</option>
              {allCourses.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          {course && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                关联章节 (可选)
              </label>
              <select
                value={chapterSlug}
                onChange={(e) => setChapterSlug(e.target.value)}
                className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">不关联</option>
                {course.chapters.map((ch: any) => (
                  <option key={ch.slug} value={ch.slug}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Tag className="h-3.5 w-3.5" />
            标签 (最多 5 个)
          </label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-950/30 dark:text-primary-300"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="rounded p-0.5 hover:bg-primary-100 dark:hover:bg-primary-900/40"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder={tags.length === 0 ? "输入后回车 (例如: 过拟合, sklearn)" : ""}
              className="flex-1 min-w-[120px] bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Link
            href="/qa/"
            className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            发布问题
          </button>
        </div>
      </form>
    </div>
  );
}
