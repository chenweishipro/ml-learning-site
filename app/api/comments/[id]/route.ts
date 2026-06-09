// 单条评论操作
import { getCurrentUser } from "@/lib/auth";
import { deleteComment, hideComment, toggleLikeComment } from "@/lib/comments";
import { isAdmin } from "@/lib/roles";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const result = await deleteComment({
    id: params.id,
    userId: viewer.id,
    isAdmin: isAdmin(viewer.role),
  });
  if (!result.ok) return fail(result.error, 400);
  return ok({ deleted: true });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "like") {
    const r = await toggleLikeComment({ id: params.id, userId: viewer.id });
    if (!r.ok) return fail(r.error, 400);
    return ok(r.data);
  }
  if (action === "hide") {
    const r = await hideComment({ id: params.id, isAdmin: isAdmin(viewer.role) });
    if (!r.ok) return fail(r.error, 400);
    return ok({ hidden: true });
  }
  return fail("未知 action, 支持 like / hide", 400);
}
