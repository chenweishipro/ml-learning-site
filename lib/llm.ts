// LLM 文本生成 Provider 抽象层 (可插拔)
// 用途: v8.3 RAG 答疑 + v8.3 AI 润色 + v8.6 流式输出 + v8.6 翻译
//
// 提供三种实现:
//  1. MockLLMProvider:  本地 extractive 答案, 无需 API key (默认)
//  2. OpenAILLMProvider: 兼容 OpenAI /v1/chat/completions 协议
//  3. MiniMaxLLMProvider: MiniMax 自有 /v1/text/chatcompletion_v2 协议
//
// 切换: LLM_PROVIDER=mock | openai | minimax

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  readonly name: string;
  /** 单次对话 (非流式) */
  chat(messages: LLMMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<string>;
  /** 流式对话 (SSE) — yield 每个 token chunk */
  streamChat(messages: LLMMessage[], opts?: { maxTokens?: number; temperature?: number }): AsyncGenerator<string, void, void>;
}

/* ===========================================================================
 * 1. Mock 实现: 简单的 extractive 回答 (从 context 中抽取最相关句子)
 * 适合: 没有 API key 时仍能演示
 * =========================================================================== */

class MockLLMProvider implements LLMProvider {
  readonly name = "mock-extractive";

  async chat(messages: LLMMessage[]): Promise<string> {
    const last = messages[messages.length - 1];
    if (!last) return "(mock) 暂无回答";
    const userMsg = last.content;
    const sysMsg = messages.find((m) => m.role === "system");
    let context = "";
    if (sysMsg) {
      const match = sysMsg.content.match(/\[参考资料\]([\s\S]*?)\[\/参考资料\]/);
      if (match) context = match[1];
    }

    if (!context.trim()) {
      return "（本地 mock 模式: 没有匹配的参考资料, 所以无法回答。你可以: 1) 换个问法 2) 配置 LLM_PROVIDER=minimax + MINIMAX_API_KEY 启用真实 LLM）";
    }

    const sentences = context
      .split(/(?<=[。！？.!?\n])\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const lowerUser = userMsg.toLowerCase();
    const userWords = lowerUser
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, ""));

    const scored = sentences.map((s) => {
      const lower = s.toLowerCase();
      let score = 0;
      for (const w of userWords) {
        if (lower.includes(w)) score += 2;
      }
      return { s, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored
      .filter((s) => s.score > 0)
      .slice(0, 3)
      .map((s) => s.s);

    if (top.length === 0) {
      return sentences.slice(0, 2).join("\n\n");
    }
    return `（本地 mock 模式: 从相关章节摘录）\n\n${top.join("\n\n")}`;
  }

  // Mock 也支持流式: 按句子逐个 yield, 加 50ms 延迟模拟打字效果
  async *streamChat(messages: LLMMessage[]): AsyncGenerator<string, void, void> {
    const text = await this.chat(messages);
    // 按中文标点切分, 一次 yield 一句
    const sentences = text.split(/(?<=[。！？.!?\n])\s*/).filter((s) => s.length > 0);
    for (const s of sentences) {
      await new Promise((r) => setTimeout(r, 80));
      yield s;
    }
  }
}

/* ===========================================================================
 * 2. OpenAI 兼容实现 (含 SSE 流式)
 * =========================================================================== */

class OpenAILLMProvider implements LLMProvider {
  readonly name: string;
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.name = process.env.OPENAI_LLM_MODEL ?? "gpt-4o-mini";
    this.baseUrl = (process.env.OPENAI_LLM_BASE_URL ?? process.env.OPENAI_EMBEDDING_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    this.model = this.name;
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAI LLM provider");
    }
  }

  async chat(messages: LLMMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: opts?.maxTokens ?? 800,
        temperature: opts?.temperature ?? 0.3,
        stream: false,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LLM API error: ${res.status} ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error("LLM API: invalid response");
    }
    return data.choices[0].message?.content ?? "";
  }

  async *streamChat(messages: LLMMessage[], opts?: { maxTokens?: number; temperature?: number }): AsyncGenerator<string, void, void> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: opts?.maxTokens ?? 800,
        temperature: opts?.temperature ?? 0.3,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const err = res.ok ? "no body" : await res.text();
      throw new Error(`LLM stream error: ${res.status} ${err.slice(0, 200)}`);
    }
    yield* parseSSEStream(res.body, (chunk) => chunk.choices?.[0]?.delta?.content ?? "");
  }
}

/* ===========================================================================
 * 3. MiniMax provider (使用 MiniMax 自有的 chatcompletion_v2 端点, 含 SSE 流式)
 * =========================================================================== */

class MiniMaxLLMProvider implements LLMProvider {
  readonly name: string;
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.name = (process.env.MINIMAX_MODEL ?? "MiniMax-Text-01") + "@minimax";
    this.baseUrl = (process.env.MINIMAX_BASE_URL ?? "https://api.minimaxi.com/v1").replace(/\/$/, "");
    this.apiKey = process.env.MINIMAX_API_KEY ?? "";
    this.model = process.env.MINIMAX_MODEL ?? "MiniMax-Text-01";
    if (!this.apiKey) {
      throw new Error("MINIMAX_API_KEY is required for MiniMax provider");
    }
  }

  async chat(messages: LLMMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const res = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: opts?.maxTokens ?? 2048,
        temperature: opts?.temperature ?? 0.3,
        stream: false,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MiniMax API error: ${res.status} ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error("MiniMax API: invalid response");
    }
    return data.choices[0].message?.content ?? "";
  }

  async *streamChat(messages: LLMMessage[], opts?: { maxTokens?: number; temperature?: number }): AsyncGenerator<string, void, void> {
    const res = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: opts?.maxTokens ?? 2048,
        temperature: opts?.temperature ?? 0.3,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const err = res.ok ? "no body" : await res.text();
      throw new Error(`MiniMax stream error: ${res.status} ${err.slice(0, 200)}`);
    }
    // MiniMax 用 OpenAI 兼容的 SSE chunk 格式 (delta.content)
    yield* parseSSEStream(res.body, (chunk) => chunk.choices?.[0]?.delta?.content ?? "");
  }
}

/* ===========================================================================
 * SSE 流解析器 (OpenAI 兼容协议)
 * 输入: ReadableStream + content 提取函数
 * 输出: yield 每个 token 的文本字符串
 * =========================================================================== */

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
  extractContent: (chunk: any) => string
): AsyncGenerator<string, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // 按 \n\n 切分 (SSE 事件之间)
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? ""; // 最后一段可能不完整, 留到下次
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]" || !data) continue;
      try {
        const json = JSON.parse(data);
        const text = extractContent(json);
        if (text) yield text;
      } catch {
        // ignore malformed chunk
      }
    }
  }
  // flush remaining buffer
  if (buffer.trim().startsWith("data:")) {
    const data = buffer.trim().slice(5).trim();
    if (data && data !== "[DONE]") {
      try {
        const json = JSON.parse(data);
        const text = extractContent(json);
        if (text) yield text;
      } catch {
        /* */
      }
    }
  }
}

/* ===========================================================================
 * 工厂方法
 * =========================================================================== */

export let _provider: LLMProvider | null = null;
let _providerEnv: string | null = null;

export function resetLLMProvider(): void {
  _provider = null;
  _providerEnv = null;
}

export function getLLMProvider(): LLMProvider {
  const which = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
  // 缓存失效: env 变了或 _provider 未设过
  if (_provider && _providerEnv === which) return _provider;
  _providerEnv = which;
  // env 设为 MINIMAX 或 minimax 都认
  const MINIMAX = "MiniMax".toLowerCase();
  if (which === MINIMAX || which === "openai" || which === "openai-compatible") {
    if (which === MINIMAX) {
      _provider = new MiniMaxLLMProvider();
    } else {
      _provider = new OpenAILLMProvider();
    }
  } else {
    _provider = new MockLLMProvider();
  }
  return _provider;
}