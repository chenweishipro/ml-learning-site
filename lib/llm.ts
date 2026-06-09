// LLM 文本生成 Provider 抽象层 (可插拔)
// 用途: v8.3 RAG 答疑 + v8.3 AI 润色 用同一套 provider
//
// 提供两种实现:
//  1. MockLLMProvider:  本地 extractive 答案, 无需 API key (默认)
//  2. OpenAILLMProvider: 兼容 OpenAI /v1/chat/completions 协议
//
// 切换: LLM_PROVIDER=mock | openai

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  readonly name: string;
  /** 单次对话 */
  chat(messages: LLMMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<string>;
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
    // 尝试从 system 消息中提取 context (如果存在)
    const sysMsg = messages.find((m) => m.role === "system");
    let context = "";
    if (sysMsg) {
      const match = sysMsg.content.match(/\[参考资料\]([\s\S]*?)\[\/参考资料\]/);
      if (match) context = match[1];
    }

    if (!context.trim()) {
      return "（本地 mock 模式: 没有匹配的参考资料, 所以无法回答。你可以: 1) 换个问法 2) 配置 LLM_PROVIDER=openai + OPENAI_API_KEY 启用真实 LLM）";
    }

    // 抽取最相关句子
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
      // fallback: 第一句长一点的
      return sentences.slice(0, 2).join("\n\n");
    }
    return `（本地 mock 模式: 从相关章节摘录）\n\n${top.join("\n\n")}`;
  }
}

/* ===========================================================================
 * 2. OpenAI 兼容实现
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
}

/* ===========================================================================
 * 工厂方法
 * =========================================================================== */

let _provider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (_provider) return _provider;
  const which = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
  if (which === "openai" || which === "openai-compatible") {
    _provider = new OpenAILLMProvider();
  } else {
    _provider = new MockLLMProvider();
  }
  return _provider;
}
