// 单条笔记操作
import { getCurrentUser } from "@/lib/auth";
import { updateNote, deleteNote } from "@/lib/notes";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const body = await readJson<{ content?: string; color?: "yellow" | "red" | "green" | "blue" }>(req);
  if (!body) return fail("请求格式错误", 400);
  const result = await updateNote({
    id: params.id,
    userId: viewer.id,
    content: body.content,
    color: body.color,
  });
  if (!result.ok) return fail(result.error, 400);
  return ok({ note: result.data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);
  const result = await deleteNote({ id: params.id, userId: viewer.id });
  if (!result.ok) return fail(result.error, 400);
  return ok({ deleted: true });
}
