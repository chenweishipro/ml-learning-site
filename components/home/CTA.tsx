"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function CTA() {
  const { t } = useI18n();
  return (
    <section className="container pb-20">
      <div className="relative overflow-hidden rounded-2xl border border-primary-200/60 dark:border-primary-800/40 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-950/40 dark:via-neutral-900 dark:to-accent-950/40 px-6 py-14 text-center sm:px-12">
        <div
          aria-hidden
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-200/40 blur-3xl"
        />
        <div className="relative">
          <h2 className="text-display-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {t("home.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-600 dark:text-neutral-400">
            {t("home.ctaSubtitle")}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/courses/"
              className="group inline-flex h-12 items-center gap-2 rounded-md bg-primary-600 px-6 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
            >
              {t("home.ctaPrimary")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/about/"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-white dark:bg-neutral-900/80 px-6 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 backdrop-blur transition hover:bg-white dark:bg-neutral-900 dark:bg-neutral-900"
            >
              {t("home.ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}