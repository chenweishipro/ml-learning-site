/** 邮件简报订阅 / 退订 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function parse(body: any) {
  if (!body || typeof body !== "object") return null;
  const enabled = body.enabled !== false;
  const frequency = body.frequency === "monthly" ? "monthly" : "weekly";
  const topics = Array.isArray(body.topics) ? body.topics.filter((t: any) => typeof t === "string") : ["new_chapters", "progress"];
  return { enabled, frequency, topics };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sub = await prisma.newsletterSubscription.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    subscription: sub ? {
      enabled: sub.enabled,
      frequency: sub.frequency,
      topics: JSON.parse(sub.topics),
      lastSentAt: sub.lastSentAt?.toISOString() ?? null,
    } : {
      enabled: false,
      frequency: "weekly",
      topics: ["new_chapters"],
      lastSentAt: null,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = parse(body);
  if (!parsed) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const sub = await prisma.newsletterSubscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      enabled: parsed.enabled,
      frequency: parsed.frequency,
      topics: JSON.stringify(parsed.topics),
    },
    update: {
      enabled: parsed.enabled,
      frequency: parsed.frequency,
      topics: JSON.stringify(parsed.topics),
    },
  });
  return NextResponse.json({ ok: true, subscription: {
    enabled: sub.enabled,
    frequency: sub.frequency,
    topics: JSON.parse(sub.topics),
  } });
}
