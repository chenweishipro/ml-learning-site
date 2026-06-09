"use client";

import Link from "next/link";
import { BookOpen, RefreshCw } from "lucide-react";

export function OfflineActions() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => location.reload()}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
      >
        <RefreshCw className="h-4 w-4" />
        重新加载
      </button>
      <Link
        href="/me/"
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary-300 hover:text-primary-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      >
        <BookOpen className="h-4 w-4" />
        我的学习
      </Link>
    </div>
  );
}
