import Link from "next/link";
import { Sparkles, Clock, BookOpen, Trophy, Database, ArrowRight, Target } from "lucide-react";
import { CAPSTONE_PROJECTS } from "@/lib/capstone-projects";

export const metadata = {
  title: "实战项目 · ML 学习站",
  description: "6 个端到端 Capstone 项目, 跨多章综合应用所学知识。",
};

const DIFFICULTY_META: Record<string, { label: string; tone: string }> = {
  beginner: { label: "入门", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50" },
  intermediate: { label: "进阶", tone: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50" },
  advanced: { label: "高级", tone: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50" },
};

const DOMAIN_LABEL: Record<string, string> = {
  ml: "机器学习",
  stats: "统计学",
  cv: "计算机视觉",
  nlp: "自然语言处理",
  rl: "强化学习",
  viz: "数据可视化",
};

export default function CapstoneIndex() {
  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
            <Trophy className="h-3 w-3" />
            实战项目 · Capstone
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">用学过的做点什么</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            6 个端到端综合项目, 每个跨多章节, 包含数据、步骤、评分标准。做完一个, 简历有话说。
          </p>
        </div>
        <Link
          href="/curriculum/"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Target className="h-4 w-4" />
          学习路线图
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPSTONE_PROJECTS.map((p) => {
          const meta = DIFFICULTY_META[p.difficulty];
          return (
            <Link
              key={p.id}
              href={`/capstone/${p.id}/`}
              className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${meta.tone}`}>
                  {meta.label}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {DOMAIN_LABEL[p.domain]}
                </span>
              </div>
              <h2 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-50 dark:group-hover:text-primary-300">
                {p.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{p.subtitle}</p>
              <div className="mt-4 flex items-center gap-3 text-[10px] text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {p.hours} 小时
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> {p.coursesCount} 课
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {p.prerequisites.length} 章节
                </span>
              </div>
              <div className="mt-auto pt-3 text-[10px] text-neutral-400">
                数据: {p.dataset.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
