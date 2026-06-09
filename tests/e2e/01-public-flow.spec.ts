import { test, expect } from "@playwright/test";

/**
 * 公共流程 E2E 测试
 * 不需要登录的页面:
 *   1. 首页加载
 *   2. 课程列表
 *   3. 课程详情
 *   4. 章节页 (登录后才能看到全部内容, 公共章节)
 *   5. 搜索
 *   6. 问答列表
 *   7. 离线页
 *   8. PWA manifest
 */
test.describe("公共流程 (无需登录)", () => {
  test("首页加载 + Stats 图标可见", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ML 学习站/);

    // hero
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Stats 区域: 4 个卡片都有 icon (SVG) 和数字
    // label 是 "系统课程" (注意: 不是 "系统化课程")
    const statsSection = page.locator("section").filter({ has: page.getByText("系统课程") });
    await expect(statsSection).toBeVisible();
    const lucideIcons = statsSection.locator("svg.lucide");
    expect(await lucideIcons.count()).toBe(4);

    // 关键修复 (commit dd6de21): 之前 icon 缺 color class, 继承白色看不见
    // 现在每个 icon 应有 text-primary-600 (light) 或 text-white (dark)
    for (const icon of await lucideIcons.all()) {
      const color = await icon.evaluate((el) => getComputedStyle(el).color);
      // 在 light 模式: 紫色 (rgb(124, 58, 237)) 或衍生
      // 排除白色 (说明没颜色 class)
      expect(color).not.toBe("rgb(255, 255, 255)");
    }
  });

  test("课程列表 + 进入课程", async ({ page }) => {
    await page.goto("/courses/");
    await expect(page.locator("h1, h2, h3").filter({ hasText: "机器学习入门" }).first()).toBeVisible();
    // 找到链到 ml-basics 课程页的链接
    const link = page.locator('a[href*="/courses/ml-basics"]').first();
    await link.click();
    await expect(page).toHaveURL(/courses\/ml-basics/);
  });

  test("搜索 API", async ({ request }) => {
    const r = await request.get("/api/search/?q=过拟合");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.ok).toBe(true);
    expect(data.data.total).toBeGreaterThan(0);
  });

  test("问答列表页 (未登录可访问)", async ({ page }) => {
    const r = await page.goto("/qa/");
    expect(r?.ok()).toBeTruthy();
    await expect(page.getByText("问答社区")).toBeVisible();
  });

  test("离线页", async ({ page }) => {
    const r = await page.goto("/offline/");
    expect(r?.ok()).toBeTruthy();
    await expect(page.getByText("没有网络连接")).toBeVisible();
  });

  test("PWA manifest + service worker", async ({ page, request }) => {
    const r = await request.get("/manifest.json");
    expect(r.ok()).toBeTruthy();
    const data = await r.json();
    expect(data.name).toBe("ML 学习站");
    expect(data.icons.length).toBeGreaterThanOrEqual(3);

    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
  });
});
