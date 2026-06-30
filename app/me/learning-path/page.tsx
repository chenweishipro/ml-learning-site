/** /me/learning-path — 个人学习路径
 *  - 加载当前 active 路径
 *  - 未选过: 显示 4 个 goal 选择
 *  - 已选: 显示 step 列表 + 进度
 *  - 可重新生成 (覆盖现有)
 */
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GOAL_OPTIONS, getActivePath } from "@/lib/learning-path";
import { LearningPathClient } from "@/components/learning-path/LearningPathClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "我的学习路径",
  description: "基于你的目标定制的机器学习系统化学习路径",
};

export default async function LearningPathPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login/?next=/me/learning-path/");

  const activePath = await getActivePath(user.id);
  return (
    <LearningPathClient
      goals={GOAL_OPTIONS}
      initialPath={activePath}
      userName={user.displayName || user.email.split("@")[0]}
    />
  );
}