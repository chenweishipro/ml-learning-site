// 合并提案 (admin) — 核心流程:
//   1. 校验状态
//   2. 冲突检测
//   3. 写入 override
//   4. 创建 ContentRevision 快照
//   5. 更新 proposal 状态
//   6. 发送站内信给作者 + 超级管理员
import { requireAdmin } from "@/lib/admin";
import { mergeProposal } from "@/lib/proposals";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const body = await readJson<{ force?: boolean; reviewNote?: string }>(req);
  const force = body?.force === true;
  const reviewNote = body?.reviewNote;

  const result = await mergeProposal({
    id: params.id,
    reviewerId: auth.user.id,
    force,
    reviewNote,
  });

  if (!result.ok) {
    if (result.error === "CONFLICT") {
      return Response.json(
        { ok: false, error: "内容有冲突, 请审核后再合并", code: "CONFLICT", data: result.data },
        { status: 409 }
      );
    }
    return fail(result.error, 400);
  }

  return ok({
    proposal: result.data,
    revisionId: result.revisionId,
  });
}
