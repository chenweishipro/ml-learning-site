import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/glossary";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "术语表 · ML 学习站",
  description: "跨章节术语统一定义, 在任何章节 hover 术语即可查看。",
};

const CAT_COLOR: Record<string, string> = {
  ml: "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50",
  stats: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
  math: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50",
  code: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:ring-cyan-800/50",
  data: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50",
};

export default function GlossaryPage() {
  // 字母分组
  const byLetter: Record<string, typeof GLOSSARY> = {};
  for (const e of GLOSSARY) {
    const k = e.term[0].toUpperCase();
    (byLetter[k] = byLetter[k] || []).push(e);
  }
  const letters = Object.keys(byLetter).sort();

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
          <BookOpen className="h-3 w-3" />
          术语表
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{GLOSSARY.length} 个术语 · 一处定义全站通用</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          在任何章节阅读时, 鼠标移到带虚线下划线的术语上, 即可看到弹出的定义卡片。
        </p>
      </div>

      {/* 分类标签 */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-500">分类:</span>
        {Object.entries(GLOSSARY_CATEGORIES).map(([k, label]) => (
          <span key={k} className={cn("rounded-full px-2 py-0.5 ring-1", CAT_COLOR[k])}>
            {label} ({GLOSSARY.filter((e) => e.category === k).length})
          </span>
        ))}
      </div>

      {/* 按字母分组 */}
      <div className="space-y-8">
        {letters.map((letter) => (
          <section key={letter}>
            <h2 className="mb-3 text-2xl font-bold text-primary-600">{letter}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {byLetter[letter].map((e) => (
                <div
                  key={e.term}
                  className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-50">{e.term}</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1", CAT_COLOR[e.category])}>
                      {GLOSSARY_CATEGORIES[e.category]}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{e.short}</p>
                  {e.relatedChapters && e.relatedChapters.length > 0 && (
                    <ul className="mt-2 space-y-0.5 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                      {e.relatedChapters.map((c) => (
                        <li key={`${c.courseSlug}/${c.chapterSlug}`}>
                          <Link
                            href={`/courses/${c.courseSlug}/${c.chapterSlug}/`}
                            className="inline-flex items-center gap-0.5 text-[11px] text-primary-700 hover:underline dark:text-primary-300"
                          >
                            <ArrowRight className="h-2.5 w-2.5" /> {c.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
