// LLM Provider 抽象层 (可插拔)
// 用途: v8.2 AI 语义搜索 + v8.3 RAG 答疑 + v8.3 AI 润色 都用同一套 provider
//
// 提供两种内置实现:
//  1. MockEmbeddingProvider:  基于 TF-IDF 风格 + 词袋, 完全本地, 无需 API key
//  2. OpenAIEmbeddingProvider: 兼容 OpenAI /v1/embeddings 协议 (OpenAI, DeepSeek, Zhipu, 豆包 等)
//
// 切换方式: 环境变量
//  - EMBEDDING_PROVIDER=mock (默认)
//  - EMBEDDING_PROVIDER=openai + OPENAI_API_KEY + OPENAI_EMBEDDING_BASE_URL + OPENAI_EMBEDDING_MODEL

export interface EmbeddingProvider {
  /** 模型名, 用于展示 + 缓存 */
  readonly name: string;
  /** 向量维度 */
  readonly dim: number;
  /** 把文本转成向量 */
  embed(text: string): Promise<number[]>;
  /** 批量 (可优化并发) */
  embedBatch(texts: string[]): Promise<number[][]>;
}

/* ===========================================================================
 * 1. Mock 实现: 基于词袋 + 字符级 n-gram, 纯本地
 * 适合: 没有 API key 时仍能演示语义搜索
 * 策略: 中文按字符切, 英文按词切, 加上 2-gram, 简单 TF
 * =========================================================================== */

function tokenize(text: string): string[] {
  const t = text.toLowerCase();
  const tokens: string[] = [];
  // 切出英文/数字词
  const wordMatches = t.match(/[a-z0-9]+/g) ?? [];
  tokens.push(...wordMatches);
  // 中文: 字符 + 2-gram
  const cjk = t.match(/[\u4e00-\u9fff]+/g) ?? [];
  for (const s of cjk) {
    for (let i = 0; i < s.length; i++) {
      tokens.push(s[i]);
      if (i + 2 <= s.length) tokens.push(s.slice(i, i + 2));
    }
  }
  return tokens;
}

const MOCK_VOCAB: string[] = (() => {
  // 固定 1024 维, 简单哈希
  const v: string[] = [];
  // 通过把常见字符/token 映射到固定 hash
  return v;
})();

function hashToken(t: string, dim: number): number {
  let h = 0;
  for (let i = 0; i < t.length; i++) {
    h = (h * 31 + t.charCodeAt(i)) >>> 0;
  }
  return h % dim;
}

class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock-tfidf";
  readonly dim = 256;

  async embed(text: string): Promise<number[]> {
    return this._embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this._embed(t));
  }

  private _embed(text: string): number[] {
    const vec = new Array(this.dim).fill(0);
    const tokens = tokenize(text);
    if (tokens.length === 0) return vec;
    // 统计 token 频次
    const counts = new Map<number, number>();
    for (const tok of tokens) {
      const h = hashToken(tok, this.dim);
      counts.set(h, (counts.get(h) ?? 0) + 1);
    }
    // 写入向量, 用 log 缩放
    for (const [h, c] of counts) {
      vec[h] += 1 + Math.log(c);
    }
    // L2 归一化
    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < this.dim; i++) vec[i] = vec[i] / norm;
    return vec;
  }
}

/* ===========================================================================
 * 2. OpenAI 兼容实现
 * 适合: 有 OpenAI / DeepSeek / 智谱 / 豆包 / 硅基流动 等任何兼容 /v1/embeddings 的服务
 * =========================================================================== */

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name: string;
  readonly dim: number;

  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.name = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
    this.dim = Number(process.env.OPENAI_EMBEDDING_DIM ?? "1536");
    this.baseUrl = (process.env.OPENAI_EMBEDDING_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAI embedding provider");
    }
  }

  async embed(text: string): Promise<number[]> {
    const r = await this.embedBatch([text]);
    return r[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.name,
        input: texts,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Embedding API error: ${res.status} ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Embedding API: invalid response");
    }
    return data.data.map((d: any) => d.embedding as number[]);
  }
}

/* ===========================================================================
 * 工厂方法
 * =========================================================================== */

let _provider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (_provider) return _provider;
  const which = (process.env.EMBEDDING_PROVIDER ?? "mock").toLowerCase();
  if (which === "openai" || which === "openai-compatible") {
    _provider = new OpenAIEmbeddingProvider();
  } else {
    _provider = new MockEmbeddingProvider();
  }
  return _provider;
}

/** 余弦相似度 (假设输入已 L2 归一化, 但仍然算一遍保证正确) */
export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}
