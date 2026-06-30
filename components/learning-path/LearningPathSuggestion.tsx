/** 课程详情页底部的「推荐学习路径」模块
 *  服务端组件, 直接查 lib/learning-path 的 PATH_TEMPLATES
 *  如果当前课程在某个 goal 路径里, 提示用户「生成完整学习路径」
 */
import Link from "next/link";
import { Sparkles, ArrowRight, Target } from "lucide-react";
import { PATH_TEMPLATES, GOAL_OPTIONS } from "@/lib/learning-path";

interface Props {
  courseSlug: string;
}

export function LearningPathSuggestion({ courseSlug }: Props) {
  // 找到这门课出现在哪些路径里
  const matches: { goal: string; label: string; emoji: string; position: number; total: number; nextSlug?: string; nextTitle?: string }[] = [];

  for (const [goal, tmpl] of Object.entries(PATH_TEMPLATES)) {
    const idx = tmpl.courses.findIndex((c) => c.slug === courseSlug);
    if (idx < 0) continue;
    const next = tmpl.courses[idx + 1];
    matches.push({
      goal,
      label: GOAL_OPTIONS.find((g) => g.value === goal)?.label || goal,
      emoji: GOAL_OPTIONS.find((g) => g.value === goal)?.emoji || "🎯",
      position: idx + 1,
      total: tmpl.courses.length,
      nextSlug: next?.slug,
      nextTitle: next ? undefined : undefined, // 需动态查, 这里只给 slug
    });
  }

  if (matches.length === 0) return null;

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-violet-950/30">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
          这门课在以下学习路径中
        </h3>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        当前课程出现在 {matches.length} 条系统化路径里, 你可以一键生成完整学习计划, 自动跳过已完成章节。
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <Link
            key={m.goal}
            href={`/me/learning-path/?goal=${m.goal}`}
            className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-700"
          >
            <div className="text-2xl">{m.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-900 group-hover:text-indigo-700 dark:text-neutral-50 dark:group-hover:text-indigo-300">
                {m.label} 之路
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <Target className="h-3 w-3" />
                第 {m.position} / {m.total} 步
                {m.nextSlug && (
                  <>
                    <span>·</span>
                    <span>下一步 {m.nextSlug}</span>
                  </>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}