// 认证工具:密码哈希 / JWT 签发 / Cookie 管理 / 重置 token
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "ml-site-session";
const SESSION_TTL = Number(process.env.AUTH_SESSION_TTL ?? 2592000); // 30 天
const RESET_TTL = Number(process.env.AUTH_RESET_TTL ?? 3600); // 1 小时

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (need >=32 chars). Set it in .env");
  }
  return new TextEncoder().encode(s);
}

// ============== 密码 ==============

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ============== 邮箱校验 ==============

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

// ============== 密码强度 ==============

export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("至少 8 个字符");
  if (!/[A-Za-z]/.test(pw)) issues.push("至少包含一个字母");
  if (!/[0-9]/.test(pw)) issues.push("至少包含一个数字");
  return issues;
}

// ============== JWT Session ==============

export type SessionPayload = {
  sub: string; // user id
  email: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, displayName: true, createdAt: true },
  });
  return user;
}

// ============== 重置密码 token ==============

// 生成原始 token(发给用户) + 哈希(存数据库)
export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export const RESET_TTL_SECONDS = RESET_TTL;
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
