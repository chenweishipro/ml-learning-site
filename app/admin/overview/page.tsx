import { OverviewClient } from "./OverviewClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "管理概览 · ML 学习站" };

export default function OverviewPage() {
  return <OverviewClient />;
}
