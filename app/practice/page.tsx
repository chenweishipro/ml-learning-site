import type { Metadata } from "next";
import { PracticeClient } from "./PracticeClient";

export const metadata: Metadata = {
  title: "章节练习排行",
  description: "全站章节练习最高分排行 + 我的练习统计。",
};

export default function PracticePage() {
  return <PracticeClient />;
}
