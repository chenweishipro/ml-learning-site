import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, readJson } from "@/lib/api";

export const runtime = "nodejs";

const DISPLAY_NAME_RE = /^[\u4e00-\u9fa5A-Za-z0-9 _\-.]{0,40}$/;
const BIO_MAX = 200;
const AVATAR_MAX_LEN = 500; // base64 data url

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401, "UNAUTHENTICATED");

  const body = await readJson<{ displayName?: string; bio?: string; avatarUrl?: string | null; profilePublic?: number }>(req);
  if (!body) return fail("请求格式错误", 400);

  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    if (body.displayName === "" || body.displayName == null) {
      data.displayName = null;
    } else if (!DISPLAY_NAME_RE.test(body.displayName)) {
      return fail("昵称只能含中英文字母数字和空格/_-./", 400);
    } else {
      data.displayName = body.displayName.trim();
    }
  }
  if (body.bio !== undefined) {
    if (body.bio && body.bio.length > BIO_MAX) {
      return fail(`简介最多 ${BIO_MAX} 字`, 400);
    }
    data.bio = body.bio?.trim() || null;
  }
  if (body.avatarUrl !== undefined) {
    if (body.avatarUrl && body.avatarUrl.length > AVATAR_MAX_LEN) {
      return fail("头像 URL 过长", 400);
    }
    data.avatarUrl = body.avatarUrl || null;
  }
  if (body.profilePublic !== undefined) {
    if (body.profilePublic !== 0 && body.profilePublic !== 1) {
      return fail("profilePublic 必须 0/1", 400);
    }
    data.profilePublic = body.profilePublic;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, email: true, displayName: true, bio: true, avatarUrl: true, profilePublic: true, role: true },
  });
  return ok({ user: updated });
}
