import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, ListChecks, PlayCircle } from "lucide-react";
import type { Recommendation } from "@/lib/recommend";

const REASON_META: Record<Recommendation["reason"], { icon: any; label: string; tone: string }> = {
  in_progress: { icon: PlayCircle, label: "继续学习", tone: "text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/30 ring-primary-200" },
  next_course: { icon: Sparkles, label: "解锁新课程", tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 ring-emerald-200" },
  starter: { icon: BookOpen, label: "从这里开始", tone: "text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/30 ring-accent-200" },
};

export function NextStepsCard({ recs }: { recs: Recommendation[] }) {
  if (!recs.length) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-neutral-400" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">下一步学什么</h2>
        </div>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          还没有推荐 — 浏览 <Link href="/courses" className="text-primary-700 hover:underline">课程目录</Link> 选一门课开始。
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">下一步学什么</h2>
        <span className="ml-auto rounded-full px-2 py-0.5 text-xs ring-1 bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
          智能推荐
        </span>
      </div>
      <ul className="space-y-3">
        {recs.map((r, i) => {
          const meta = REASON_META[r.reason];
          const Icon = meta.icon;
          return (
            <li key={`${r.course.slug}-${r.chapter.slug}-${i}`}>
              <Link
                href={`/courses/${r.course.slug}/${r.chapter.slug}/`}
                className="group flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-950/50"
              >
                <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-md ring-1 ${meta.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                      {r.course.title}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${meta.tone}`}>
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="mt-0.5 truncate text-sm font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                    {r.chapter.title}
                  </h3>
                  {r.chapter.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                      {r.chapter.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="mt-2 h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
