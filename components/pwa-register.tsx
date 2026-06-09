"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // 只在生产环境 + http/https 协议下注册
    if (location.protocol !== "http:" && location.protocol !== "https:") return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        // 检查更新
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // 新版本已就绪, 但旧版本还在控制页面
              // 简单提示: 触发 update, 用户刷新后激活
              console.log("[PWA] New service worker available. Reload to update.");
            }
          });
        });
        console.log("[PWA] Service worker registered:", reg.scope);
      } catch (e) {
        console.warn("[PWA] Service worker registration failed:", e);
      }
    };
    register();
  }, []);

  return null;
}
