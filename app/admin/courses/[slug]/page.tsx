"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
  RotateCcw,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RevisionsPanel } from "@/components/admin/RevisionsPanel";
import { LEVEL_META, cn } from "@/lib/utils";

interface ChapterMeta {
  slug: string;
  title: string;
  description: string;
  duration: string;
}

interface CourseMeta {
  slug: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  tags?: string[];
  chapters: ChapterMeta[];
}

interface CourseOverride {
  id: string;
  courseSlug: string;
  title: string | null;
  description: string | null;
  level: string | null;
  duration: string | null;
  tags: string | null;
  body: string | null;
  updatedAt: string;
}

export default function CourseEditPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseMeta | null>(null);
  const [override, setOverride] = useState<CourseOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [duration, setDuration] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [revisionsRefreshKey, setRevisionsRefreshKey] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${params.slug}/`, { credentials: "include" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setCourse(data.data.course);
      setOverride(data.data.override);

      // 初始化表单: 如果有 override, 用 override; 否则用 base
      const c = data.data.course;
      const o = data.data.override;
      setTitle(o?.title ?? c.title);
      setDescription(o?.description ?? c.description);
      setLevel((o?.level as CourseMeta["level"]) ?? c.level);
      setDuration(o?.duration ?? c.duration);
      setTagsRaw(((o?.tags ? safeParseTags(o.tags) : c.tags) ?? []).join(", "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const tags = tagsRaw
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/courses/${params.slug}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim() || null,
          description: description.trim() || null,
          level,
          duration: duration.trim() || null,
          tags: tags.length > 0 ? tags : null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      setRevisionsRefreshKey((k) => k + 1);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("确定要删除该课程的所有覆盖, 回到仓库原始版本吗? 此操作不可撤销。")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${params.slug}/`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "重置失败");
        return;
      }
      await load();
      setRevisionsRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="container py-10 sm:py-12">
      <div className="mb-6 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/admin/" className="hover:text-primary-700 dark:hover:text-primary-300">
          管理后台
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-900 dark:text-neutral-50">{course.title}</span>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50">
            🛠 编辑课程元数据
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            修改后, 公开页面的课程卡片、详情页、筛选器会立即看到新内容。
          </p>
        </div>
        {override && (
          <button
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800/40 dark:bg-neutral-900 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置为原始版本
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* 左侧: 编辑表单 */}
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              课程标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              课程简介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                难度
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseMeta["level"])}
                className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
              >
                <option value="beginner">入门</option>
                <option value="intermediate">进阶</option>
                <option value="advanced">高级</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                总时长
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="例如: 约 6 小时"
                className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              标签
            </label>
            <input
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="用逗号分隔, 例如: 入门, 监督学习, sklearn"
              className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagsRaw
                .split(/[,，]/)
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t) => (
                  <Badge key={t} variant="neutral">
                    {t}
                  </Badge>
                ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存修改
            </Button>
            {savedAt && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                已保存 · {savedAt}
              </span>
            )}
            {override && (
              <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
                上次编辑: {new Date(override.updatedAt).toLocaleString("zh-CN")}
              </span>
            )}
          </div>
        </div>

        {/* 右侧: 修订历史 + 章节列表 */}
        <div className="space-y-4">
          <RevisionsPanel
            scope="course"
            courseSlug={params.slug}
            refreshKey={revisionsRefreshKey}
            onRollbackSuccess={async () => {
              await load();
              setRevisionsRefreshKey((k) => k + 1);
              setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }) + " (回滚)");
            }}
          />
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary-600" />
              <CardTitle className="text-base">章节列表</CardTitle>
            </div>
            <CardDescription className="mb-4">
              共 {course.chapters.length} 个章节。点击进入编辑 MDX 正文。
            </CardDescription>
            <ol className="space-y-2">
              {course.chapters.map((ch, idx) => (
                <li key={ch.slug}>
                  <Link
                    href={`/admin/courses/${course.slug}/chapters/${ch.slug}/`}
                    className="group flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3 text-sm transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
                  >
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-primary-50 text-xs font-semibold text-primary-700 ring-1 ring-primary-100 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-neutral-900 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300">
                      {ch.title}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <div className="mt-4 rounded-md border border-dashed border-neutral-300 p-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            <div className="flex items-start gap-2">
              <Edit3 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>
                目前<strong>只能编辑元数据 + 章节正文</strong>。课程的章节列表(增/删/重排)暂未支持,需在 <code>content/courses/_index.ts</code> 修改。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function safeParseTags(s: string | null): string[] | undefined {
  if (!s) return undefined;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : undefined;
  } catch {
    return undefined;
  }
}
