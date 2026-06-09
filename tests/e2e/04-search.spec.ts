import { test, expect } from "@playwright/test";

/**
 * 搜索流程
 * 1. 全文搜索
 * 2. 语义搜索
 * 3. 切换模式
 */
test.describe("搜索", () => {
  test("全文搜索 '过拟合'", async ({ request }) => {
    const r = await request.get("/api/search/?q=过拟合");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.total).toBeGreaterThan(0);
    expect(data.data.hits.length).toBeGreaterThan(0);
    // snippet 包含 <mark>
    const firstSnippet = data.data.hits[0].snippet;
    expect(firstSnippet).toContain("<mark>");
  });

  test("语义搜索 '什么是过拟合'", async ({ request }) => {
    const r = await request.get("/api/semantic/?q=过拟合");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.total).toBeGreaterThan(0);
    // provider
    expect(data.data.provider).toBeTruthy();
    // 第一个 hit 应有 score
    expect(data.data.hits[0].score).toBeGreaterThan(0);
  });

  test("搜索 'gradient' 英文", async ({ request }) => {
    const r = await request.get("/api/search/?q=gradient");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    // 至少有一个章节包含 gradient (代码块里)
    expect(data.data.total).toBeGreaterThan(0);
  });

  test("搜索空 query → 0 hits", async ({ request }) => {
    const r = await request.get("/api/search/?q=");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.total).toBe(0);
  });
});
