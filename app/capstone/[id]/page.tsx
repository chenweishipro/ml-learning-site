import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen, Database, Target, FileText, Wrench, Sparkles, CheckCircle2, Trophy, Layers, ExternalLink as Ext } from "lucide-react";
import { CAPSTONE_PROJECTS, getCapstoneProject } from "@/lib/capstone-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIFFICULTY_META: Record<string, { label: string; tone: string }> = {
  beginner: { label: "入门", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50" },
  intermediate: { label: "进阶", tone: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50" },
  advanced: { label: "高级", tone: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50" },
};

export default function CapstoneDetail({ params }: { params: { id: string } }) {
  const project = getCapstoneProject(params.id);
  if (!project) notFound();
  const meta = DIFFICULTY_META[project.difficulty];
  const others = CAPSTONE_PROJECTS.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/capstone/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300">
        <ArrowLeft className="h-3.5 w-3.5" />
        回到项目列表
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.tone}`}>
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          <Clock className="h-3 w-3" /> {project.hours} 小时
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          <BookOpen className="h-3 w-3" /> {project.coursesCount} 门课 · {project.prerequisites.length} 章节
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          <Layers className="h-3 w-3" /> {project.steps.length} 步
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">{project.subtitle}</p>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-4 w-4 text-primary-600" />
          项目说明
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-neutral-700 dark:text-neutral-300">
          {project.description}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-4 w-4 text-primary-600" />
          前置知识 ({project.prerequisites.length} 章节)
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {project.prerequisites.map((p) => (
            <Link
              key={`${p.courseSlug}/${p.chapterSlug}`}
              href={`/courses/${p.courseSlug}/${p.chapterSlug}/`}
              className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2.5 text-sm transition hover:border-primary-300 hover:bg-primary-50 dark:border-neutral-800 dark:bg-neutral-950/50 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {p.courseSlug.includes("stats") ? "S" : "M"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{p.title}</div>
                <div className="truncate text-[10px] text-neutral-500">{p.courseSlug}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Database className="h-4 w-4 text-primary-600" />
          数据集
        </h2>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{project.dataset.name}</div>
            <div className="text-xs text-neutral-500">{project.dataset.size}</div>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{project.dataset.description}</p>
          </div>
          <a
            href={project.dataset.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm text-primary-700 transition hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-950/50"
          >
            <Ext className="h-3.5 w-3.5" />
            打开
          </a>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Target className="h-4 w-4 text-primary-600" />
          实施步骤 ({project.steps.length} 步)
        </h2>
        <ol className="space-y-2">
          {project.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950/50">
              <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {i + 1}
              </span>
              <span className="text-sm text-neutral-800 dark:text-neutral-200">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-4 w-4 text-amber-500" />
            评分标准
          </h2>
          <ul className="space-y-2">
            {project.rubric.map((r, i) => (
              <li key={i} className="rounded-md border border-neutral-200 p-2.5 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {r.weight}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{r.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Wrench className="h-4 w-4 text-primary-600" />
            推荐技术栈
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <span
                key={t}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {t}
              </span>
            ))}
          </div>

          <h3 className="mt-5 mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">交付物</h3>
          <ul className="space-y-1">
            {project.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                {d}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-4 w-4 text-primary-600" />
          其他项目
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.id}
              href={`/capstone/${o.id}/`}
              className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="text-sm font-semibold">{o.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{o.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
