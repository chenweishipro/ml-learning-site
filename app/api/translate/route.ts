// /api/translate — 中英互译 (LLM)
// 用 LLM 翻译整段文本,支持缓存避免重复请求
// GET /api/translate?text=...&from=zh&to=en
import { NextRequest } from "next/server";
import { getLLMProvider } from "@/lib/llm";

export const runtime = "nodejs";

/** Mock 翻译: 仅仅是告诉用户配置了 mock 模式, 保留原文 */
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
    // 删除最早插入的
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

  if (!text) return Response.json({ ok: false, error: "empty text" }, { status: 400 });
  if (text.length > 5000) return Response.json({ ok: false, error: "text too long (max 5000)" }, { status: 400 });
  if (from === to) return Response.json({ ok: true, translated: text, cached: false });

  const key = cacheKey(text, from, to);
  const cached = cacheGet(key);
  if (cached) {
    return Response.json({ ok: true, translated: cached, cached: true });
  }

  try {
    const provider = getLLMProvider();
    // 检测 mock provider, 直接用专门的占位翻译
    if (provider.name.startsWith("mock")) {
      return Response.json({
        ok: true,
        translated: mockTranslate(text, from, to),
        cached: false,
        provider: provider.name,
        note: "Mock mode: configure LLM_PROVIDER=MiniMax + MINIMAX_API_KEY for real translation",
      });
    }
    const sysPrompt =
      from === "zh" && to === "en"
        ? "You are a professional translator. Translate the following Chinese text into natural, idiomatic English. Preserve Markdown formatting, code blocks, and technical terms (e.g. algorithm names like 过拟合 → Overfitting). Return ONLY the translation, no preamble."
        : "You are a professional translator. Translate the following English text into natural, idiomatic Simplified Chinese. Preserve Markdown formatting, code blocks, and technical terms (e.g. Overfitting → 过拟合). Return ONLY the translation, no preamble.";
    const result = await provider.chat(
      [
        { role: "system", content: sysPrompt },
        { role: "user", content: text },
      ],
      { maxTokens: Math.min(2000, Math.ceil(text.length * 1.5)), temperature: 0.2 }
    );
    const translated = (result || "").trim();
    if (!translated) {
      return Response.json({ ok: false, error: "empty translation" }, { status: 502 });
    }
    cacheSet(key, translated);
    return Response.json({ ok: true, translated, cached: false, provider: provider.name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "translate failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}