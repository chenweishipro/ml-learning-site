// 提案: 创建 + 列表
// 任何登录用户都可以创建 (POST) 和看自己的 / 看已合并的 (GET)
// 管理员可以看全部
import { getCurrentUser } from "@/lib/auth";
import { createProposal, listProposals, getProposalStats } from "@/lib/proposals";
import { isAdmin } from "@/lib/admin";
import { getChapterWithOverrides, getCourseWithOverrides } from "@/lib/content-overrides";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as any;
  const scope = url.searchParams.get("scope") as any;
  const courseSlug = url.searchParams.get("courseSlug") || undefined;
  const chapterSlug = url.searchParams.get("chapterSlug") || undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const authorId = url.searchParams.get("authorId") || undefined;

  const proposals = await listProposals({
    status: status || undefined,
    scope: scope || undefined,
    courseSlug,
    chapterSlug,
    limit: Math.min(limit, 200),
    authorId,
    viewer: { id: viewer.id, role: viewer.role },
  });

  const stats = await getProposalStats({ id: viewer.id, role: viewer.role });

  return ok({ proposals, stats });
}

export async function POST(req: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return fail("未登录", 401);

  const body = await readJson<{
    scope?: "course" | "chapter";
    courseSlug?: string;
    chapterSlug?: string;
    title?: string;
    description?: string;
    proposedBody?: string;
  }>(req);
  if (!body) return fail("请求格式错误", 400);

  if (!body.scope || (body.scope !== "course" && body.scope !== "chapter")) {
    return fail("scope 必须是 course 或 chapter", 400);
  }
  if (!body.courseSlug) return fail("缺少 courseSlug", 400);
  if (body.scope === "chapter" && !body.chapterSlug) {
    return fail("scope=chapter 时必须提供 chapterSlug", 400);
  }

  // 拿当前内容作为 baseSnapshot
  let baseSnapshot = "";
  if (body.scope === "chapter") {
    const data = await getChapterWithOverrides(body.courseSlug, body.chapterSlug!);
    if (!data) return fail("章节不存在", 404);
    baseSnapshot = data.content;
  } else {
    const course = await getCourseWithOverrides(body.courseSlug);
    if (!course) return fail("课程不存在", 404);
    // 课程 snapshot: 打包元信息为 JSON
    baseSnapshot = JSON.stringify({
      title: course.title,
      description: course.description,
      level: course.level,
      duration: course.duration,
      tags: course.tags,
      body: null,
    });
  }

  // 提案内容不能跟基准内容完全一样 (避免无意义提案)
  if (body.proposedBody === baseSnapshot) {
    return fail("提案内容与当前内容完全一致, 无需提交", 400);
  }

  const result = await createProposal({
    authorId: viewer.id,
    scope: body.scope,
    courseSlug: body.courseSlug,
    chapterSlug: body.chapterSlug,
    title: body.title ?? "",
    description: body.description ?? "",
    proposedBody: body.proposedBody ?? "",
    baseSnapshot,
  });

  if (!result.ok) return fail(result.error, 400);

  // 给所有管理员发站内信 (让管理员知道有新提案)
  try {
    const { createNotifications } = await import("@/lib/notifications");
    const admins = await (await import("@/lib/db")).prisma.user.findMany({
      where: { role: { in: ["admin", "superadmin"] }, NOT: { id: viewer.id } },
      select: { id: true },
    });
    const author = viewer;
    const authorName = author.displayName || author.email;
    const whereText = body.scope === "chapter"
      ? `${body.courseSlug} / ${body.chapterSlug}`
      : body.courseSlug;
    const link = `/admin/proposals/`;
    await createNotifications(
      admins.map((a) => ({
        recipientId: a.id,
        type: "proposal_submitted" as const,
        title: `📬 ${authorName} 提交了一个内容修改提案`,
        body: `提案「${body.title}」(${body.scope} / ${whereText}) 等待审核。`,
        link,
        meta: { proposalId: result.data.id, authorId: viewer.id },
      }))
    );
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }

  return ok({ proposal: result.data });
}
