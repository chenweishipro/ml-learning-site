/** 邮件简报预览 (admin 调试用) */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { buildWeeklyContent, renderNewsletter } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const content = await buildWeeklyContent();
  const { subject, html, text } = renderNewsletter({
    email: "preview@example.com",
    displayName: "Preview",
    content,
  });
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
