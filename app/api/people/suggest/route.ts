import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findSimilarUsers } from "@/lib/people";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const list = await findSimilarUsers(user.id, 8);
  return NextResponse.json({ users: list });
}
