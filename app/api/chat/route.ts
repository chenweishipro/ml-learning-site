// AI 答疑 API (支持流式 SSE)
// POST /api/chat  body: { query, history?, topK?, stream?: boolean }
// 默认 stream=true, 返回 text/event-stream
//   data: {"type":"sources","data":[...]}\n\n
//   data: {"type":"chunk","data":"过拟合..."}\n\n
//   data: {"type":"done","data":{provider,model,query}}\n\n
// 如果 stream=false, 返回完整 JSON { answer, sources, provider, model, query }
import { ragChat, ragChatStream } from "@/lib/rag";
import { ok, fail } from "@/lib/api";
import type { LLMMessage } from "@/lib/llm";

export const runtime = "nodejs";

interface ChatRequest {
  query: string;
  history?: LLMMessage[];
  topK?: number;
  stream?: boolean;
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

  // 流式响应 (默认)
  if (body.stream !== false) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          for await (const event of ragChatStream({
            query: body.query,
            history: body.history ?? [],
            topK: body.topK ?? 3,
          })) {
            send({ type: event.type, data: event.data });
          }
        } catch (e) {
          send({
            type: "error",
            data: e instanceof Error ? e.message : "AI 答疑失败",
          });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // 非流式 (兼容旧客户端)
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

// GET for simple single-turn (保留兼容性, 非流式)
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