"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, BarChart3, BookOpen, Clock, Loader2, Edit3, History, Users } from "lucide-react";
import { LEVEL_META, cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

interface CourseListItem {
  slug: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  tags: string[];
  chapterCount: number;
  hasOverride: boolean;
  overrideUpdatedAt: string | null;
}

export default function AdminHome() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState<CourseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/courses/", { credentials: "include" });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "加载失败");
          return;
        }
        setItems(data.data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "网络错误");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="container py-10 sm:py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50">
            🛠 管理后台
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">课程内容管理</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            编辑课程元数据 (标题、简介、标签), 或进入课程编辑章节正文。
            <br />
            改动会保存到数据库, 立即在公开页面生效。原始 MDX 文件不动, 可随时"重置"回到仓库版本。
          </p>
        </div>
        {isSuperAdmin && (
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
          >
            <Users className="h-4 w-4" />
            用户管理
            <span className="ml-1 inline-flex items-center rounded-full bg-rose-200/60 px-1.5 py-0.5 text-[10px] font-medium dark:bg-rose-800/60">
              超级
            </span>
          </Link>
        )}
        <Link
          href="/admin/analytics" className="inline-flex items-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-800/50 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/50"
        >
          <BarChart3 className="h-4 w-4" />
          学习看板
        </Link>
        <Link
          href="/admin/quality"
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
        >
          <Award className="h-4 w-4" />
          质量报告
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/admin/courses/${c.slug}/`}
            className="group block"
          >
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700">
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                    LEVEL_META[c.level].classes
                  )}
                >
                  {LEVEL_META[c.level].label}
                </span>
                {c.hasOverride && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
                    <Edit3 className="h-3 w-3" />
                    已编辑
                  </span>
                )}
              </div>

              <h2 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                {c.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                {c.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {c.chapterCount} 章
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {c.duration}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
