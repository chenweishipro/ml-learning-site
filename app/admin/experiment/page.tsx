import type { Metadata } from "next";
import { ExperimentAdminClient } from "./ExperimentAdminClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "A/B 测试 · admin",
  description: "创建 A/B 实验, 实时查看每个 variant 的曝光/点击/转化率",
};

export default function ExperimentAdminPage() {
  return <ExperimentAdminClient />;
}
