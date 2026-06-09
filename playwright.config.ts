import { defineConfig, devices } from "@playwright/test";
import * as path from "path";

/**
 * Playwright E2E 配置
 * 用已安装的 chromium binary (--executable-path)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // 串行避免 cookie 冲突
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:7893",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? "/root/.cache/ms-playwright/chromium-1223/chrome-linux/chrome",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
