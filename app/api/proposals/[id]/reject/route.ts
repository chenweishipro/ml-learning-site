// 拒绝提案 (admin)
import { requireAdmin } from "@/lib/admin";
import { rejectProposal } from "@/lib/proposals";
import { fail, ok, readJson } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const body = await readJson<{ reviewNote?: string }>(req);
  if (!body || !body.reviewNote?.trim()) {
    return fail("拒绝时必须填写理由", 400);
  }

  const result = await rejectProposal({
    id: params.id,
    reviewerId: auth.user.id,
    reviewNote: body.reviewNote,
  });
  if (!result.ok) return fail(result.error, 400);

  // 给作者发站内信
  try {
    const reviewerName = auth.user.displayName || auth.user.email;
    const note = body.reviewNote.trim();
    await createNotification({
      recipientId: result.data.authorId,
      type: "proposal_rejected",
      title: "你的修改建议未通过审核",
      body: `${reviewerName} 拒绝了你的提案「${result.data.title}」。理由: ${note}`,
      link: `/proposals/${result.data.id}`,
      meta: {
        proposalId: result.data.id,
        reviewerId: auth.user.id,
      },
    });
  } catch (e) {
    console.error("Failed to send reject notification:", e);
  }

  return ok({ proposal: result.data });
}
