import Link from "next/link";
import { ArrowRight, ArrowLeft, Layers, BookOpen, Sparkles } from "lucide-react";
import type { RelatedChapter } from "@/lib/recommend";

const REASON_META: Record<RelatedChapter["reason"], { icon: any; label: string; tone: string }> = {
  same_course: { icon: BookOpen, label: "同课程", tone: "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50" },
  prereq_chain: { icon: Layers, label: "相关主题", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50" },
  next_level: { icon: Sparkles, label: "下一步深入", tone: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50" },
};

export function RelatedChaptersCard({ items }: { items: RelatedChapter[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">学完这章, 你可能想看</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it, i) => {
          const meta = REASON_META[it.reason];
          const Icon = meta.icon;
          return (
            <Link
              key={`${it.course.slug}-${it.chapter.slug}-${i}`}
              href={`/courses/${it.course.slug}/${it.chapter.slug}/`}
              className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${meta.tone}`}>
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{it.course.title}</span>
              </div>
              <h4 className="line-clamp-2 text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                {it.chapter.title}
              </h4>
              {it.chapter.description && (
                <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{it.chapter.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between text-[10px] text-neutral-500">
                {it.chapter.duration && <span>{it.chapter.duration}</span>}
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
