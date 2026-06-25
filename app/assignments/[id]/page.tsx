import type { Metadata } from "next";
import { AssignmentDetailClient } from "./AssignmentDetailClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "作业详情",
  description: "查看作业详情并提交。",
};

export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  return <AssignmentDetailClient assignmentId={params.id} />;
}
