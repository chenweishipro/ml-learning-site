import Link from "next/link";
import { Search, BookOpen, Home, Sparkles, ChevronRight } from "lucide-react";
import { getAllCoursesWithOverrides } from "@/lib/content-overrides";
import { LEVEL_META } from "@/lib/utils";

export default async function NotFound() {
  const allCourses = await getAllCoursesWithOverrides().catch(() => []);
  const featured = allCourses.slice(0, 4);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-950/30 dark:text-primary-400 dark:ring-primary-800/50">
          <Search className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-display-sm font-bold tracking-tight sm:text-display-md">
          404 · 页面找不到了
        </h1>
        <p className="mt-3 max-w-md text-neutral-600 dark:text-neutral-400">
          你访问的链接可能已失效、课程内容正在筹备中, 或内容已被移动。请回到首页, 或浏览下列推荐课程。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary-600 px-5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
          >
            <Home className="h-4 w-4" />
            回到首页
          </Link>
          <Link
            href="/search/"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 transition hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-800"
          >
            <Search className="h-4 w-4" />
            搜索课程
          </Link>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Sparkles className="h-4 w-4" />
            <span>推荐课程</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}/`}
                className="group flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50">
                      {c.title}
                    </h3>
                    {c.level && (
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${LEVEL_META[c.level]?.classes ?? ""}`}
                      >
                        {LEVEL_META[c.level]?.label ?? c.level}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                    {c.description}
                  </p>
                </div>
                <ChevronRight className="mt-3 h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}