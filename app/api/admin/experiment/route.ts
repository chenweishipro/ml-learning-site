/** admin 实验 CRUD + 实时统计 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const experiments = await prisma.experiment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, displayName: true, email: true } },
      _count: { select: { events: true } },
    },
  });

  // 实时统计每个 experiment 的 variant × type 计数
  const stats: Record<string, any> = {};
  for (const exp of experiments) {
    const variants = JSON.parse(exp.variants);
    const events = await prisma.experimentEvent.groupBy({
      by: ["variantId", "type"],
      where: { experimentId: exp.id },
      _count: { id: true },
    });
    // 整理为 variant → { impression, click, conversion } 格式
    const variantStats: Record<string, any> = {};
    for (const v of variants) {
      variantStats[v.id] = { name: v.name, impression: 0, click: 0, conversion: 0 };
    }
    for (const e of events) {
      if (variantStats[e.variantId]) {
        variantStats[e.variantId][e.type] = (variantStats[e.variantId][e.type] ?? 0) + e._count.id;
      }
    }
    // 计算转化率
    for (const vid of Object.keys(variantStats)) {
      const v = variantStats[vid];
      const ctr = v.impression > 0 ? (v.click / v.impression * 100).toFixed(2) : "0.00";
      const cvr = v.click > 0 ? (v.conversion / v.click * 100).toFixed(2) : "0.00";
      v.ctr = ctr;
      v.cvr = cvr;
    }
    stats[exp.id] = { variants: variantStats };
  }

  return ok({ experiments, stats });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return fail("需要管理员权限", 403, "FORBIDDEN");

  const body = await readJson<{
    key: string;
    name: string;
    description?: string;
    variants: Array<{ id: string; name: string; value?: string; weight: number }>;
    status?: string;
  }>(req);

  if (!body?.key?.trim() || !body?.name?.trim()) return fail("必填字段缺失", 400);
  if (!Array.isArray(body.variants) || body.variants.length < 2) {
    return fail("至少需要 2 个 variant", 400);
  }
  // key 唯一
  const existing = await prisma.experiment.findUnique({ where: { key: body.key } });
  if (existing) return fail("key 已存在", 409, "DUPLICATE_KEY");

  const experiment = await prisma.experiment.create({
    data: {
      key: body.key.trim(),
      name: body.name.trim(),
      description: body.description ?? null,
      variants: JSON.stringify(body.variants),
      status: body.status ?? "draft",
      startedAt: body.status === "running" ? new Date() : null,
      createdById: user.id,
    },
  });
  return ok({ experiment });
}
