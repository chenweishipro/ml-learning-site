import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null, isAdmin: false });
  return ok({ user, isAdmin: await isAdmin(user.email) });
}
