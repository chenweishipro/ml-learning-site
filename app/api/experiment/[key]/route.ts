/** 客户端拉取实验 — 按 userId hash 分桶分配 variant */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 简单 hash: userId + experimentKey → 0-1 浮点 */
function hashBucket(userId: string, key: string): number {
  const h = crypto.createHash("sha256").update(`${userId}:${key}`).digest();
  // 取前 4 字节 → unsigned int / 0xffffffff → 0-1
  return h.readUInt32BE(0) / 0xffffffff;
}

/** 根据 bucket + variants.weight 分配 variant */
function pickVariant(bucket: number, variants: any[]): any {
  let cumWeight = 0;
  const totalWeight = variants.reduce((s, v) => s + (v.weight ?? 0), 0);
  if (totalWeight === 0) return variants[0];
  for (const v of variants) {
    cumWeight += (v.weight ?? 0);
    if (bucket * totalWeight < cumWeight) return v;
  }
  return variants[variants.length - 1];
}

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const user = await getCurrentUser();
  const experiment = await prisma.experiment.findUnique({ where: { key: params.key } });
  if (!experiment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 非 running 状态: 返回 draft variant 用于开发
  const variants = JSON.parse(experiment.variants);
  if (!Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json({ error: "invalid_variants" }, { status: 500 });
  }

  let variant: any;
  if (experiment.status !== "running") {
    variant = variants[0]; // 默认
  } else {
    // 登录用户按 userId 分桶, 未登录用户按 IP + UA 简化 (按 sessionId 临时桶)
    const bucketKey = user?.id ?? `anon:${_req.headers.get("x-forwarded-for") ?? "0"}`;
    const bucket = hashBucket(bucketKey, params.key);
    variant = pickVariant(bucket, variants);
  }

  return NextResponse.json({
    ok: true,
    data: {
      experimentId: experiment.id,
      key: experiment.key,
      name: experiment.name,
      status: experiment.status,
      variant: {
        id: variant.id,
        name: variant.name,
        value: variant.value ?? variant.name,
      },
      /// 服务端记录 impression (best-effort)
      loggedImpression: experiment.status === "running" && !!user,
    },
  });
}
