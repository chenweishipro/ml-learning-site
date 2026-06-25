import type { Metadata } from "next";
import { KnowledgeGraphClient } from "./KnowledgeGraphClient";

export const metadata: Metadata = {
  title: "知识图谱",
  description: "可视化 18 门课程 64 章节之间的前置依赖关系, 一眼看全学习路径。",
};

export default function KnowledgeGraphPage() {
  return <KnowledgeGraphClient />;
}
