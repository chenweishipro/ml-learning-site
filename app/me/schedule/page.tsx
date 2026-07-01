/** /me/schedule — 学习日历周历视图 */
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveSchedule } from "@/lib/weekly-schedule";
import { getActivePath } from "@/lib/learning-path";
import { WeeklyScheduleClient } from "@/components/schedule/WeeklyScheduleClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "学习周历 · ML 学习站",
  description: "把你的学习路径展开成周计划, 每天 1-2 章, 7 天一周, 打卡完成",
};

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/?next=/me/schedule/");

  const schedule = await getActiveSchedule(user.id);
  // 序列化 Date → ISO string (server-to-client component 边界)
  const serializedSchedule = schedule
    ? {
        ...schedule,
        weekStart: schedule.weekStart.toISOString(),
        tasks: schedule.tasks.map((t) => ({
          ...t,
          studyDate: t.studyDate.toISOString(),
          completedAt: t.completedAt?.toISOString() || null,
        })),
      }
    : null;
  const activePath = await getActivePath(user.id);

  return (
    <WeeklyScheduleClient
      initialSchedule={serializedSchedule}
      activePath={activePath}
      userName={user.displayName || user.email.split("@")[0]}
    />
  );
}
