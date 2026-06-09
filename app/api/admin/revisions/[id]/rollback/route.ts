// 管理员: 把某次快照回滚为当前内容
import { requireAdmin, logEdit } from "@/lib/admin";
import { rollbackToRevision } from "@/lib/revisions";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

/**
 * POST /api/admin/revisions/[id]/rollback
 * 把指定快照恢复为当前内容
 * - 先把当前 override 状态保存为快照 (source: 'rollback'), 防止误操作
 * - 然后用快照里的值覆盖 override
 * - 历史快照不删除
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const result = await rollbackToRevision({
    revisionId: params.id,
    userId: auth.user.id,
  });

  if (!result.ok) return fail(result.error, 400);

  // 写编辑日志
  await logEdit({
    userId: auth.user.id,
    scope: result.data.scope,
    courseSlug: result.data.courseSlug,
    chapterSlug: "chapterSlug" in result.data ? result.data.chapterSlug : undefined,
    action: "save",
    summary: `回滚到快照 ${params.id}`,
  });

  return ok({ rolledBack: true, target: result.data });
}
