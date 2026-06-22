/** 健康检查 — 监控用 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLLMProvider } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // 1) DB
  try {
    const t = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { ok: true, latencyMs: Date.now() - t };
  } catch (e: any) {
    checks.db = { ok: false, error: e?.message ?? "db error" };
  }

  // 2) LLM
  try {
    const t = Date.now();
    const llm = getLLMProvider();
    checks.llm = { ok: !!llm, latencyMs: Date.now() - t, ...(llm ? {} : { error: "no LLM provider" }) };
  } catch (e: any) {
    checks.llm = { ok: false, error: e?.message ?? "llm error" };
  }

  // 3) Disk (用 fs.statSync dev.db)
  try {
    const fs = await import("fs/promises");
    const stat = await fs.stat("/opt/ml-learning/.next/standalone/prisma/dev.db");
    checks.disk = { ok: true, latencyMs: 0 };
    (checks.disk as any).sizeMb = Math.round(stat.size / 1024 / 1024);
  } catch (e: any) {
    checks.disk = { ok: false, error: e?.message ?? "disk error" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      uptimeSec: Math.floor(process.uptime()),
      totalLatencyMs: Date.now() - start,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
