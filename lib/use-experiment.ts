/** v18.3 A/B 测试客户端 hook — 按 experiment key 拉 variant */
"use client";
import { useEffect, useState } from "react";

interface ExperimentData {
  experimentId: string;
  key: string;
  name: string;
  status: string;
  variant: { id: string; name: string; value: string };
}

export function useExperiment(key: string): ExperimentData | null {
  const [data, setData] = useState<ExperimentData | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/experiment/${encodeURIComponent(key)}/`);
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled && j.ok) setData(j.data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [key]);
  return data;
}

/** 上报事件 (impression/click/conversion) */
export function reportExperiment(experimentKey: string, variantId: string, type: "impression" | "click" | "conversion", metadata?: any) {
  try {
    fetch("/api/experiment/event/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experimentKey, variantId, type, metadata }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
