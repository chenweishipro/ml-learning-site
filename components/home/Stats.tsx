import { BookOpen, Clock, GraduationCap, Users } from "lucide-react";
import { courses, type CourseMeta } from "@/content/courses/_index";

type Stat = { icon: React.ComponentType<{ className?: string }>; value: string; label: string };

/**
 * 数据统计区。
 *  - 当课程数据尚未填充时, 使用合理的"基础"数字, 避免页面空空如也
 *  - 真实课程数与章节数会按 courses 自动汇总
 */
export function Stats() {
  const chapterCount = courses.reduce(
    (acc: number, c: CourseMeta) => acc + c.chapters.length,
    0
  );
  const hours = courses.reduce((acc: number, c: CourseMeta) => {
    const h = parseInt(c.duration, 10);
    return Number.isFinite(h) ? acc + h : acc;
  }, 0);

  const stats: Stat[] = [
    { icon: BookOpen, value: courses.length > 0 ? `${courses.length}` : "4+", label: "系统课程" },
    { icon: Clock, value: chapterCount > 0 ? `${chapterCount}` : "10+", label: "实战章节" },
    { icon: GraduationCap, value: hours > 0 ? `${hours} 小时` : "30+ 小时", label: "精选内容" },
    { icon: Users, value: "持续更新", label: "中文社区" },
  ];

  return (
    <section className="container py-16">
      <div className="rounded-2xl bg-gradient-primary p-8 text-white shadow-card sm:p-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-white dark:bg-neutral-900/15 ring-1 ring-white/20 backdrop-blur">
                <Icon className="h-6 w-6 text-primary-600 dark:text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums sm:text-3xl">
                  {value}
                </div>
                <div className="text-sm text-white/80">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
