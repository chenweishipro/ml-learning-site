// AI 答疑 API
import { ragChat } from "@/lib/rag";
import { ok, fail } from "@/lib/api";
import type { LLMMessage } from "@/lib/llm";

export const runtime = "nodejs";

interface ChatRequest {
  query: string;
  history?: LLMMessage[];
  topK?: number;
}

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return fail("Invalid JSON", 400);
  }
  if (!body.query?.trim()) {
    return fail("query is required", 400);
  }
  try {
    const result = await ragChat({
      query: body.query,
      history: body.history ?? [],
      topK: body.topK ?? 3,
    });
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "AI 答疑失败", 500);
  }
}

// GET for simple single-turn (方便测试)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (!q.trim()) return ok({ answer: "(空)", sources: [], provider: "", model: "", query: "" });
  try {
    const result = await ragChat({ query: q, topK: 3 });
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "AI 答疑失败", 500);
  }
}
