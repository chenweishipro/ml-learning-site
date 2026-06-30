/** Web Vitals 客户端组件 — 上报 LCP / FID / CLS / FCP / TTFB / INP 到 /api/metrics */
"use client";

import { useReportWebVitals } from "next/web-vitals";
import { usePathname } from "next/navigation";

const ANALYTICS_ID = process.env.NEXT_PUBLIC_ANALYTICS_ID; // 可选, GA4-style ID

function sendBeacon(name: string, value: number, id: string, path: string) {
  const body = JSON.stringify({
    name,
    value: Math.round(value * 1000) / 1000, // 保留 3 位小数
    id,
    path,
    ts: Date.now(),
    ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
  });

  // 1) 优先 beacon (页面关闭也能发)
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    const ok = navigator.sendBeacon("/api/metrics", blob);
    if (ok) return;
  }
  // 2) fallback fetch keepalive
  if (typeof fetch !== "undefined") {
    fetch("/api/metrics", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  }
}

export function WebVitals() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    // 在 dev 模式打印方便调试
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug(`[WebVitals] ${metric.name}: ${metric.value}`);
    }
    sendBeacon(metric.name, metric.value, metric.id, pathname);
    // 可选: GA4
    if (ANALYTICS_ID && typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", metric.name, {
        value: Math.round(metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        page_path: pathname,
      });
    }
  });

  return null;
}