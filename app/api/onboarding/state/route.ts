// v20.1 Onboarding state API — GET 拿状态, POST 更新
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    data: {
      step: user.onboardingStep,
      doneAt: user.onboardingDoneAt,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  let body: { step?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body OK */
  }
  const step = Math.max(0, Math.min(6, Number(body.step ?? 0)));
  const doneAt = step >= 5 ? new Date() : null;
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStep: step, onboardingDoneAt: doneAt },
  });
  return NextResponse.json({ ok: true, data: { step, doneAt } });
}
