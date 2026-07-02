"use client";
import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Translate } from "@/components/translate";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* 背景装饰 */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_30%,black,transparent)]"
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
          <div className="h-[420px] w-[820px] rounded-full bg-gradient-radial from-primary-300/40 via-accent-200/30 to-transparent" />
        </div>
      </div>

      <div className="container relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center py-20 text-center sm:py-28">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-neutral-900/70 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.badge")}
          </span>

          <h1 className="text-balance text-display-sm font-bold tracking-tight sm:text-display-md">
            <Translate as="span" text="从" /> <span className="text-gradient-primary"><Translate text="数据处理" /></span> <Translate as="span" text="到" />
            <br className="hidden sm:block" />
            <Translate text="深度学习, 一站到底" />
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
            {t("home.subtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/courses/"
              className="group inline-flex h-12 items-center gap-2 rounded-md bg-primary-600 px-6 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
            >
              <Play className="h-4 w-4" />
              {t("home.heroCtaPrimary")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/courses/"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-white dark:bg-neutral-900/80 px-6 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 backdrop-blur transition hover:bg-white dark:bg-neutral-900 dark:bg-neutral-900"
            >
              <BookOpen className="h-4 w-4" />
              {t("home.heroCtaSecondary")}
            </Link>
          </div>

          <dl className="mt-12 grid w-full max-w-xl grid-cols-3 gap-4 text-left">
            {[
              { num: "4+", label: t("home.statCourses") },
              { num: "10+", label: t("home.statChapters") },
              { num: "100%", label: t("home.statLocalized") },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-white dark:bg-neutral-900/70 p-4 ring-1 ring-white/60 backdrop-blur"
              >
                <dt className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {s.num}
                </dt>
                <dd className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}