import type { Metadata } from "next";
import { AssignmentsClient } from "./AssignmentsClient";

export const metadata: Metadata = {
  title: "作业中心",
  description: "查看所有作业, 提交作业, 查看成绩和反馈。",
};

export default function AssignmentsPage() {
  return <AssignmentsClient />;
}
