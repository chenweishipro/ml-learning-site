// API 工具:统一响应格式
import { NextResponse } from "next/server";

export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error, code }, { status });
}

export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
