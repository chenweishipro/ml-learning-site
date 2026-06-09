import { test, expect } from "@playwright/test";

/**
 * 认证流程 - 主要走 API (更稳定)
 * UI 流程在 smoke 阶段用 page.goto 验证页面能加载
 */
test.describe("认证 API 流程", () => {
  const ts = Date.now();
  const email = `e2e-${ts}@example.com`;
  const password = "TestPass123!";

  test("注册新用户 → 200 + role=user", async ({ request }) => {
    const r = await request.post("/api/auth/register/", {
      data: { email, password, displayName: `E2E ${ts}` },
    });
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.user.role).toBe("user");
  });

  test("登录 → 200 + 拿 cookie", async ({ request }) => {
    const r = await request.post("/api/auth/login/", {
      data: { email, password },
    });
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.user.email).toBe(email);
  });

  test("登录错误密码 → 401 + 错误提示", async ({ request }) => {
    const r = await request.post("/api/auth/login/", {
      data: { email, password: "wrong-password-123" },
    });
    expect(r.status()).toBe(401);
    const data = await r.json();
    expect(data.ok).toBe(false);
  });

  test("注册时弱密码 → 400", async ({ request }) => {
    const r = await request.post("/api/auth/register/", {
      data: { email: `weak-${ts}@x.com`, password: "abc" },
    });
    expect(r.status()).toBe(400);
  });

  test("重复注册 → 拒绝", async ({ request }) => {
    const r = await request.post("/api/auth/register/", {
      data: { email, password },
    });
    const data = await r.json();
    expect(data.ok).toBe(false);
  });

  test("超级管理员登录后角色正确", async ({ request }) => {
    const r = await request.post("/api/auth/login/", {
      data: { email: "15000568198@local.test", password: "admintest123" },
    });
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.user.role).toBe("superadmin");
  });

  test("/me 端点: 已登录返回用户信息", async ({ request }) => {
    // 先登录
    await request.post("/api/auth/login/", {
      data: { email: "15000568198@local.test", password: "admintest123" },
    });
    const r = await request.get("/api/auth/me/");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.user.role).toBe("superadmin");
  });

  test("/me 端点: 未登录 → user=null", async ({ browser }) => {
    // 用全新 context 确保无 cookie
    const ctx = await browser.newContext();
    const r = await ctx.request.get("/api/auth/me/");
    const data = await r.json();
    // /me 端点对未登录用户返回 ok:true, user:null (而不是 error)
    expect(data.ok).toBe(true);
    expect(data.data.user).toBe(null);
    expect(data.data.isAdmin).toBe(false);
    await ctx.close();
  });
});
