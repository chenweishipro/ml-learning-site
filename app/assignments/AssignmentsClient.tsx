"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseSlug: string;
  chapterSlug: string | null;
  maxScore: number;
  dueDate: string | null;
  createdAt: string;
  createdBy: { id: string; displayName: string | null; email: string };
  _count: { submissions: number };
  mySubmission: { id: string; status: string; score: number | null } | null;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  submitted: { label: "已提交", color: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50" },
  "auto-graded": { label: "自动评分", color: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50" },
  reviewed: { label: "已批改", color: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50" },
};

export function AssignmentsClient() {
  const { user, ready } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/assignment/");
      const j = await r.json();
      if (j.ok) setAssignments(j.data.assignments);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const visible = assignments.filter((a) => {
    if (filter === "todo") return !a.mySubmission;
    if (filter === "done") return !!a.mySubmission;
    return true;
  });

  const todoCount = assignments.filter((a) => !a.mySubmission).length;
  const doneCount = assignments.length - todoCount;

  return (
    <div className="container max-w-4xl py-10">
      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1 text-xs font-medium text-white">
          <FileText className="h-3 w-3" />
          作业中心
        </div>
        <h1 className="text-3xl font-bold tracking-tight">📝 作业中心</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          完成作业巩固学习成果。{ready && user ? "" : " 登录后可提交作业并查看成绩。"}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 font-medium transition",
            filter === "all" ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
          )}
        >
          全部 ({assignments.length})
        </button>
        <button
          onClick={() => setFilter("todo")}
          className={cn(
            "rounded-full px-3 py-1 font-medium transition",
            filter === "todo" ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
          )}
        >
          待完成 ({todoCount})
        </button>
        <button
          onClick={() => setFilter("done")}
          className={cn(
            "rounded-full px-3 py-1 font-medium transition",
            filter === "done" ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
          )}
        >
          已完成 ({doneCount})
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          {assignments.length === 0 ? "还没有任何作业" : `当前筛选下没有作业`}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((a) => {
            const sub = a.mySubmission;
            const statusMeta = sub ? STATUS_META[sub.status] ?? STATUS_META.submitted : null;
            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && !sub;
            return (
              <li key={a.id}>
                <Link
                  href={`/assignments/${a.id}/`}
                  className="block rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50">
                          {a.title}
                        </h3>
                        {statusMeta && (
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", statusMeta.color)}>
                            {statusMeta?.label ?? ""}
                            {sub?.score != null ? ` · ${sub.score}分` : ""}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800/50">
                            已过期
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {a.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {a.courseSlug}
                        </span>
                        {a.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            截止 {new Date(a.dueDate).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {a._count.submissions} 人提交
                        </span>
                        <span>满分 {a.maxScore}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
