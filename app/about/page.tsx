import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Github,
  Heart,
  Sparkles,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "关于本站",
  description: "ML 学习站的设计初衷、内容来源与社区参与方式。",
};

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800/60 bg-gradient-hero">
        <div className="container py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-neutral-900/70 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800">
              <Sparkles className="h-3.5 w-3.5" />
              关于本站
            </span>
            <h1 className="text-display-sm font-bold tracking-tight sm:text-display-md">
              写给每一位 <span className="text-gradient-primary">中文 ML 学习者</span>
            </h1>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
              我们相信, 机器学习不应该被语言门槛劝退。这里是关于本站的缘起、目标与共建方式。
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">缘起</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              在筹备这门课之前, 我们调研了大量中文学习者常踩的坑: 概念翻译生硬、
              代码示例与讲解脱节、缺乏"为什么这样设计"的解释。于是我们决定
              <strong className="font-semibold text-neutral-900 dark:text-neutral-50"> 用中文重新写一遍</strong>,
              把每一处含糊的措辞都打磨到读者能"看一眼就懂"。
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              整个站点使用 Next.js 14 (App Router) + TypeScript + Tailwind CSS 构建,
              全部源码以 MIT 协议开源, 欢迎任何人在尊重作者署名权的前提下自由复用。
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">目标</h2>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <li className="flex items-start gap-2">
                <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                <span>
                  <strong className="font-semibold text-neutral-900 dark:text-neutral-50">零基础友好</strong> —
                  从 NumPy 起步, 一路串联到深度学习。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpenCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                <span>
                  <strong className="font-semibold text-neutral-900 dark:text-neutral-50">讲练结合</strong> —
                  每章都有可运行示例与可思考的小问题。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Heart className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                <span>
                  <strong className="font-semibold text-neutral-900 dark:text-neutral-50">社区共建</strong> —
                  内容与示例开放贡献, 接受 Issue / PR。
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-900 dark:bg-neutral-900 p-8 shadow-soft sm:p-10">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">参与共建</h2>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                仓库地址与提交流程将在正式上线时公布。
                在此之前, 你可以浏览课程目录, 体验站点结构与设计系统。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/courses"
                className="group inline-flex h-11 items-center gap-2 rounded-md bg-primary-600 px-5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
              >
                浏览课程
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-white dark:bg-neutral-900 dark:bg-neutral-900 px-5 text-sm font-medium text-neutral-800 dark:text-neutral-200 ring-1 ring-neutral-200 transition hover:bg-neutral-50 dark:bg-neutral-900/50"
              >
                <Github className="h-4 w-4" />
                访问 GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
