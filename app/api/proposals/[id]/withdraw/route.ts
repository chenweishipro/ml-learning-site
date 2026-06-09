// 撤回提案 (作者本人)
import { getCurrentUser } from "@/lib/auth";
import { withdrawProposal } from "@/lib/proposals";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const result = await withdrawProposal({
    id: params.id,
    userId: viewer.id,
  });
  if (!result.ok) return fail(result.error, 400);
  return ok({ proposal: result.data });
}
