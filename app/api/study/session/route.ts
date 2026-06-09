// 记录一次学习 session
import { getCurrentUser } from "@/lib/auth";
import { recordStudySession, issueCertificateIfEarned } from "@/lib/study";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401);

  const body = await readJson<{
    courseSlug?: string;
    chapterSlug?: string;
    durationSec?: number;
    completed?: boolean;
  }>(req);
  if (!body || !body.courseSlug || !body.chapterSlug) {
    return fail("缺少 courseSlug/chapterSlug", 400);
  }
  if (typeof body.durationSec !== "number" || body.durationSec < 0 || body.durationSec > 6 * 3600) {
    return fail("durationSec 不合法 (0-21600)", 400);
  }

  const session = await recordStudySession({
    userId: user.id,
    courseSlug: body.courseSlug,
    chapterSlug: body.chapterSlug,
    durationSec: body.durationSec,
    completed: body.completed === true,
  });

  // 检查是否能颁发证书
  const cert = await issueCertificateIfEarned({
    userId: user.id,
    courseSlug: body.courseSlug,
  });

  return ok({ session, certificate: cert });
}
