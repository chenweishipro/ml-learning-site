import type { Metadata } from "next";
import { UserSegmentsClient } from "./UserSegmentsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "用户分群 · admin",
  description: "基于行为自动给用户打标签, 区分活跃用户/学习狂魔/潜水党等",
};

export default function UserSegmentsPage() {
  return <UserSegmentsClient />;
}
