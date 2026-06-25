"use client";

import { useEffect } from "react";

/**
 * v16.4 移动端 PWA 检测
 * - body 加 .is-mobile / .is-standalone / .is-ios class
 * - 阻止 iOS 双击放大
 * - 检测屏幕方向
 */
export function MobileDetector() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const html = document.documentElement;
      const body = document.body;
      const ua = navigator.userAgent;

      // 移动端检测
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      body.classList.toggle("is-mobile", isMobile);
      html.classList.toggle("is-mobile", isMobile);

      // PWA standalone 检测
      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        // @ts-ignore iOS Safari standalone
        window.navigator.standalone === true;
      body.classList.toggle("is-standalone", isStandalone);
      html.classList.toggle("is-standalone", isStandalone);

      // iOS 检测 (用于特定 CSS)
      const isIOS = /iphone|ipad|ipod/i.test(ua) || 
        (/mac/.test(ua) && navigator.maxTouchPoints > 1); // iPad Pro
      body.classList.toggle("is-ios", isIOS);

      // 方向
      const orient = window.matchMedia?.("(orientation: portrait)")?.matches ? "portrait" : "landscape";
      html.setAttribute("data-orient", orient);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    // 阻止双击放大 (iOS)
    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}
