/** Web Vitals 接收端 — 记录 LCP/CLS/INP 等核心指标 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 内存中缓存 (最多 1000 条, ring buffer)
const buffer: any[] = [];
const MAX = 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ ok: false }, { status: 400 });

    const entry = {
      ...body,
      receivedAt: new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "",
    };

    if (buffer.length >= MAX) buffer.shift();
    buffer.push(entry);

    // 服务端日志 (生产可以转发到日志系统 / Prometheus / ClickHouse)
    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.log(`[metric] ${entry.name}=${entry.value} path=${entry.path}`);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/** GET: 拉取最近 N 条 (调试用, 不暴露给公网) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), MAX);
  // 简单鉴权: header 含 secret 才行
  if (req.headers.get("x-admin-secret") !== process.env.METRICS_SECRET) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    count: buffer.length,
    items: buffer.slice(-limit).reverse(),
  });
}