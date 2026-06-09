import { test, expect } from "@playwright/test";

/**
 * Q&A 流程
 * 1. 列出问题
 * 2. 提问 (需登录)
 * 3. 回答
 * 4. 投票
 * 5. 采纳
 */
test.describe("Q&A 流程", () => {
  test("未登录看到列表", async ({ page }) => {
    await page.goto("/qa/");
    await expect(page.getByText("问答社区")).toBeVisible();
  });

  test("完整 Q&A 流程: 提问 → 回答 → 投票 → 采纳", async ({ page, browser }) => {
    // 1. 用 API 登录 Alice (普通用户) 和 Super (管理员)
    const aliceLogin = await page.request.post("/api/auth/login/", {
      data: { email: "alice@example.com", password: "alice123" },
    });
    expect(aliceLogin.ok()).toBeTruthy();

    // Alice 提问
    const askRes = await page.request.post("/api/questions/", {
      data: {
        title: "E2E 测试问题: 决策树如何剪枝?",
        body: "这是 e2e 测试创建的问题, 用于验证完整 Q&A 流程。",
        tags: ["e2e", "决策树"],
      },
    });
    expect(askRes.ok()).toBeTruthy();
    const askData = await askRes.json();
    expect(askData.ok).toBe(true);
    const qid = askData.data.question.id;
    expect(qid).toBeTruthy();

    // 2. Super 回答
    const superContext = await browser.newContext();
    const superPage = await superContext.newPage();
    const superLogin = await superPage.request.post("/api/auth/login/", {
      data: { email: "15000568198@local.test", password: "admintest123" },
    });
    expect(superLogin.ok()).toBeTruthy();

    const answerRes = await superPage.request.post(`/api/questions/${qid}/answers/`, {
      data: { body: "决策树剪枝方法: 预剪枝 (限制深度/叶子数) 或 后剪枝 (用验证集)。" },
    });
    expect(answerRes.ok()).toBeTruthy();
    const answerData = await answerRes.json();
    expect(answerData.ok).toBe(true);
    const aid = answerData.data.answer.id;

    // 3. Alice 投票
    const voteRes = await page.request.post(`/api/answers/${aid}/vote/`);
    expect(voteRes.ok()).toBeTruthy();
    const voteData = await voteRes.json();
    expect(voteData.ok).toBe(true);
    expect(voteData.data.voted).toBe(true);
    expect(voteData.data.voteCount).toBe(1);

    // 4. Alice 采纳
    const acceptRes = await page.request.post(`/api/answers/${aid}/accept/`, {
      data: { questionId: qid },
    });
    expect(acceptRes.ok()).toBeTruthy();
    const acceptData = await acceptRes.json();
    expect(acceptData.ok).toBe(true);

    // 5. 验证 status 变 answered
    const detailRes = await page.request.get(`/api/questions/${qid}/`);
    expect(detailRes.ok()).toBeTruthy();
    const detail = await detailRes.json();
    expect(detail.data.question.status).toBe("answered");
    const acceptedAnswer = detail.data.question.answers.find((a: any) => a.accepted);
    expect(acceptedAnswer).toBeTruthy();
    expect(acceptedAnswer.id).toBe(aid);

    // 6. 列表里能看到
    const listRes = await page.request.get("/api/questions/?sort=newest");
    const list = await listRes.json();
    const found = list.data.questions.find((q: any) => q.id === qid);
    expect(found).toBeTruthy();
    expect(found.status).toBe("answered");

    await superContext.close();
  });
});
