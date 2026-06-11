// /api/translate — 中英互译 (LLM, SSE 流式)
// 用 LLM 流式翻译, 客户端能实时看到翻译过程
// GET /api/translate?text=...&from=zh&to=en  -> text/event-stream
//   data: {"chunk":"Hello"}\n\n
//   data: {"chunk":" world"}\n\n
//   data: {"done":true,"provider":"MiniMax-Text-01@minimax"}\n\n
import { NextRequest } from "next/server";
import { getLLMProvider } from "@/lib/llm";

export const runtime = "nodejs";

// Mock 翻译: 仅仅是告诉用户配置了 mock 模式, 保留原文
function mockTranslate(text: string, from: string, to: string): string {
  return `[mock-${from}→${to}] ${text}`;
}

// 内存缓存: 最多 500 条, 1 小时过期
const CACHE = new Map<string, { value: string; at: number }>();
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_MAX = 500;

function cacheKey(text: string, from: string, to: string) {
  return `${from}->${to}:${text}`;
}

function cacheGet(key: string): string | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL) {
    CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key: string, value: string) {
  if (CACHE.size >= CACHE_MAX) {
    const firstKey = CACHE.keys().next().value;
    if (firstKey) CACHE.delete(firstKey);
  }
  CACHE.set(key, { value, at: Date.now() });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") ?? "").trim();
  const from = (searchParams.get("from") ?? "zh").toLowerCase();
  const to = (searchParams.get("to") ?? "en").toLowerCase();

  if (!text) {
    return new Response(
      JSON.stringify({ ok: false, error: "empty text" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (text.length > 5000) {
    return new Response(
      JSON.stringify({ ok: false, error: "text too long (max 5000)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // from === to: 直接返回原文 (非流式)
  if (from === to) {
    return new Response(
      JSON.stringify({ ok: true, translated: text, cached: false }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 缓存命中: 非流式返回 (更快, 客户端无需重连)
  const key = cacheKey(text, from, to);
  const cached = cacheGet(key);
  if (cached) {
    return new Response(
      JSON.stringify({ ok: true, translated: cached, cached: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // ===== 流式翻译 =====
  const provider = getLLMProvider();

  // Mock provider: 单次返回 (保持简单)
  if (provider.name.startsWith("mock")) {
    const translated = mockTranslate(text, from, to);
    return new Response(
      JSON.stringify({
        ok: true,
        translated,
        cached: false,
        provider: provider.name,
        note: "Mock mode: configure LLM_PROVIDER=minimax + MINIMAX_API_KEY for real translation",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 真 LLM: SSE 流式返回
  const encoder = new TextEncoder();
  const sysPrompt =
    from === "zh" && to === "en"
      ? "You are a professional translator. Translate the following Chinese text into natural, idiomatic English. Preserve Markdown formatting, code blocks, and technical terms. Return ONLY the translation, no preamble."
      : "You are a professional translator. Translate the following English text into natural, idiomatic Simplified Chinese. Preserve Markdown formatting, code blocks, and technical terms. Return ONLY the translation, no preamble.";

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      try {
        for await (const chunk of provider.streamChat(
          [
            { role: "system", content: sysPrompt },
            { role: "user", content: text },
          ],
          { maxTokens: Math.min(2000, Math.ceil(text.length * 1.5)), temperature: 0.2 }
        )) {
          fullText += chunk;
          send({ chunk });
        }
        // 完成事件: 写入缓存, 通知客户端
        if (fullText) cacheSet(key, fullText);
        send({ done: true, provider: provider.name, cached: false });
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "translate failed";
        send({ error: msg });
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