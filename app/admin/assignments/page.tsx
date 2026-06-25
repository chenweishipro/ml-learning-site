import type { Metadata } from "next";
import { AdminAssignmentsClient } from "./AdminAssignmentsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "作业管理 · admin",
  description: "布置作业, 批改作业",
};

export default function AdminAssignmentsPage() {
  return <AdminAssignmentsClient />;
}
