"use client";
import { BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Translate } from "@/components/translate";

interface CoursesHeroProps {
  count: number;
}

export function CoursesHero({ count }: CoursesHeroProps) {
  const { t } = useI18n();
  return (
    <section className="border-b border-neutral-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
      <div className="container py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800">
            <BookOpen className="h-3.5 w-3.5" />
            {t("courseList.title")}
          </span>
          <h1 className="text-display-sm font-bold tracking-tight sm:text-display-md">
            <Translate text="挑一门课, 开始动手" />
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            {count > 0
              ? t("courseList.subtitle") + ` (${count})`
              : <Translate text="课程内容由后续 content 任务补充, 现在先体验页面骨架。" />}
          </p>
        </div>
      </div>
    </section>
  );
}