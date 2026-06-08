import { prisma } from "@/lib/db";
import { isValidEmail, signSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readJson<{ email?: string; password?: string }>(req);
  if (!body) return fail("请求格式错误", 400);

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) return fail("请输入邮箱和密码", 400);
  if (!isValidEmail(email)) return fail("邮箱格式不正确", 400);

  const user = await prisma.user.findUnique({ where: { email } });
  // 统一返回相同错误,避免泄露"邮箱是否存在"
  const invalidMsg = "邮箱或密码不正确";
  if (!user) return fail(invalidMsg, 401, "INVALID_CREDENTIALS");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail(invalidMsg, 401, "INVALID_CREDENTIALS");

  const token = await signSession({ sub: user.id, email: user.email });
  await setSessionCookie(token);

  return ok({
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt },
  });
}
