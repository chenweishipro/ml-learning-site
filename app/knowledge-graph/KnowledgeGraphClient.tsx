"use client";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { Sparkles, BookOpen, ArrowRight, Brain } from "lucide-react";
import Link from "next/link";

export function KnowledgeGraphClient() {
  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Brain className="h-7 w-7 text-primary-600" />
          知识图谱
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          可视化 18 门课程 64 章节之间的前置依赖关系。点击节点查看详情, 悬停看描述, 拖动缩放探索全图谱。
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800/50 dark:bg-primary-950/20">
          <div className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-300">
            <Sparkles className="h-3 w-3" /> 入门推荐
          </div>
          <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            从 <strong>机器学习入门</strong> 开始, 学完 6 章后切入 <strong>监督学习进阶</strong>。
          </p>
          <Link href="/courses/ml-basics/" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline dark:text-primary-300">
            开始学习 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800/50 dark:bg-violet-950/20">
          <div className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-300">
            <Brain className="h-3 w-3" /> LLM 路径
          </div>
          <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            完整深度学习栈: <strong>神经网络 → 深度学习进阶 → LLM 入门</strong>。
          </p>
          <Link href="/courses/llm-basics/" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline dark:text-violet-300">
            跳转 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
          <div className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <BookOpen className="h-3 w-3" /> 统计补强
          </div>
          <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            6 门统计课配套 ML, 学完 <strong>假设检验</strong> 即可上手 A/B 测试。
          </p>
          <Link href="/courses/stats-foundations/" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300">
            跳转 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <KnowledgeGraph width={1100} height={680} />

      <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="font-semibold">📌 使用说明:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><strong>节点大小</strong>: 大圆 = 课程 (18 个), 小圆 = 章节 (64 个)</li>
          <li><strong>连线</strong>: 箭头方向 = 前置 → 后续 (学完起点才能学终点)</li>
          <li><strong>横向 = 学习阶段</strong>: 越右越深, 从入门到高级</li>
          <li><strong>悬停</strong>: 右上角显示课程/章节详情</li>
          <li><strong>难度筛选</strong>: 顶部按入门/进阶/高级过滤</li>
          <li><strong>章节开关</strong>: 显示或隐藏 64 个小节点 (章节), 课程视图更清爽</li>
        </ul>
      </div>
    </div>
  );
}
