// 提案: 详情
import { getCurrentUser } from "@/lib/auth";
import { getProposal } from "@/lib/proposals";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const proposal = await getProposal(params.id, { id: viewer.id, role: viewer.role });
  if (!proposal) return fail("提案不存在或无权查看", 404);

  return ok({ proposal });
}
