import { test, expect } from "@playwright/test";

/**
 * AI 功能
 * 1. RAG 答疑
 * 2. AI 润色
 */
test.describe("AI 功能", () => {
  test("RAG 答疑 GET", async ({ request }) => {
    const r = await request.get("/api/chat/?q=过拟合是什么");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.answer).toBeTruthy();
    expect(data.data.sources.length).toBeGreaterThan(0);
    // 第一个 source 有 chapterTitle
    expect(data.data.sources[0].chapterTitle).toBeTruthy();
    expect(data.data.sources[0].excerpt).toBeTruthy();
  });

  test("RAG 答疑 POST 带 history", async ({ request }) => {
    const r = await request.post("/api/chat/", {
      data: {
        query: "反向传播",
        history: [
          { role: "user", content: "什么是神经网络" },
          { role: "assistant", content: "神经网络是..." },
        ],
        topK: 2,
      },
    });
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.sources.length).toBeLessThanOrEqual(2);
  });

  test("AI 润色 proofread", async ({ request }) => {
    const r = await request.post("/api/ai/polish/", {
      data: {
        text: "机其学习是人工智能的一个分支,   它让计算机从数据中学习规律。",
        mode: "proofread",
      },
    });
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.polished).toBeTruthy();
    expect(data.data.provider).toBeTruthy();
  });

  test("AI 润色空文本 → 400", async ({ request }) => {
    const r = await request.post("/api/ai/polish/", {
      data: { text: "" },
    });
    expect(r.status()).toBe(400);
  });
});
