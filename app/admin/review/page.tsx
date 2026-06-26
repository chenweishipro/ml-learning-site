import type { Metadata } from "next";
import { ReviewClient } from "./ReviewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "内容审核中心 · admin",
  description: "统一处理 proposals + 作业批改, 一键通过/拒绝",
};

export default function ReviewPage() {
  return <ReviewClient />;
}
