/** Assignment CRUD — GET 列表 / POST 创建 (admin) */
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const courseSlug = url.searchParams.get("courseSlug");
  const myOnly = url.searchParams.get("my") === "1";

  const where: any = {};
  if (courseSlug) where.courseSlug = courseSlug;
  if (myOnly && user) where.createdById = user.id;

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      createdBy: { select: { id: true, displayName: true, email: true } },
      _count: { select: { submissions: true } },
    },
  });

  // 如果登录了, 附 personal submission status
  let mySubs: Record<string, any> = {};
  if (user) {
    const subs = await prisma.submission.findMany({
      where: { userId: user.id, assignmentId: { in: assignments.map((a) => a.id) } },
    });
    mySubs = Object.fromEntries(subs.map((s) => [s.assignmentId, s]));
  }

  return ok({
    assignments: assignments.map((a) => ({
      ...a,
      mySubmission: mySubs[a.id] ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return fail("需要管理员权限", 403, "FORBIDDEN");

  const body = await readJson<{
    title: string;
    description: string;
    courseSlug: string;
    chapterSlug?: string;
    maxScore?: number;
    dueDate?: string;
    keywords?: string[];
    gradingPrompt?: string;
  }>(req);

  if (!body?.title?.trim() || !body?.description?.trim() || !body?.courseSlug) {
    return fail("必填字段缺失", 400);
  }

  const assignment = await prisma.assignment.create({
    data: {
      title: body.title.trim(),
      description: body.description.trim(),
      courseSlug: body.courseSlug,
      chapterSlug: body.chapterSlug ?? null,
      maxScore: body.maxScore ?? 100,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      keywords: JSON.stringify(body.keywords ?? []),
      gradingPrompt: body.gradingPrompt ?? null,
      createdById: user.id,
    },
  });
  return ok({ assignment });
}
