import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-600 ring-1 ring-primary-100">
        <Search className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-display-sm font-bold tracking-tight sm:text-display-md">
        404 · 页面找不到了
      </h1>
      <p className="mt-3 max-w-md text-neutral-600 dark:text-neutral-400">
        链接可能已失效, 或者课程内容正在筹备中。请回到首页, 或浏览当前可选的课程。
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary-600 px-5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          回到首页
        </Link>
        <Link
          href="/courses"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-white dark:bg-neutral-900 dark:bg-neutral-900 px-5 text-sm font-medium text-neutral-800 dark:text-neutral-200 ring-1 ring-neutral-200 transition hover:bg-neutral-50 dark:bg-neutral-900/50"
        >
          浏览课程
        </Link>
      </div>
    </div>
  );
}
