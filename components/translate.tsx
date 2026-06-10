"use client";
// <Translate> 客户端组件
// - 在 zh 模式下: 直接渲染原文
// - 在 en 模式下: 调用 /api/translate 翻译 (带 client-side cache)
import { useEffect, useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";

interface TranslateProps {
  text: string;
  /** 渲染标签, 默认 span */
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  /** 当翻译失败时的 fallback, 默认渲染原文 */
  fallback?: string;
}

// 客户端缓存 (避免重复请求) — 用 sessionStorage 持久化
const CLIENT_CACHE_KEY = "ml-translate-cache-v1";
function getClientCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CLIENT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function setClientCache(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify(map));
  } catch {
    /* full or disabled */
  }
}

export function Translate({ text, as: Tag = "span", className, fallback }: TranslateProps) {
  const { locale } = useI18n();
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    // zh 模式: 直接显示原文, 不请求
    if (locale === "zh") {
      setTranslated(null);
      setError(null);
      return;
    }

    const cacheKey = `zh->en:${text}`;
    if (lastKeyRef.current === cacheKey && translated) return;
    lastKeyRef.current = cacheKey;

    // 先查客户端缓存
    const cache = getClientCache();
    if (cache[cacheKey]) {
      setTranslated(cache[cacheKey]);
      setError(null);
      return;
    }

    // 没缓存, 请求
    setLoading(true);
    setError(null);
    fetch(`/api/translate?text=${encodeURIComponent(text)}&from=zh&to=en`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) throw new Error(data.error || "translate failed");
        const t = data.translated;
        // 写客户端缓存
        const newCache = { ...getClientCache(), [cacheKey]: t };
        setClientCache(newCache);
        setTranslated(t);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "translate failed");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, text]);

  // zh 模式或没翻译: 显示原文
  if (locale === "zh" || (!translated && !loading)) {
    return <Tag className={className}>{text}</Tag>;
  }

  // loading: 显示原文字 + 视觉提示
  if (loading) {
    return (
      <Tag className={className}>
        {text}
        <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-primary-400 align-middle" aria-label="translating" />
      </Tag>
    );
  }

  // 翻译失败: 显示 fallback (默认原文)
  if (error) {
    return <Tag className={className}>{fallback ?? text}</Tag>;
  }

  // 已翻译
  return <Tag className={className}>{translated}</Tag>;
}

/** 批量翻译 hook, 用于整页内容翻译 */
export function useTranslateBatch(texts: string[]) {
  const { locale } = useI18n();
  const [map, setMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locale === "zh") {
      setMap({});
      return;
    }
    // 先查本地缓存
    const cache = getClientCache();
    const need: string[] = [];
    const local: Record<string, string> = {};
    for (const t of texts) {
      const k = `zh->en:${t}`;
      if (cache[k]) local[k] = cache[k];
      else need.push(t);
    }
    setMap(local);
    if (need.length === 0) return;

    setLoading(true);
    Promise.all(
      need.map((t) =>
        fetch(`/api/translate?text=${encodeURIComponent(t)}&from=zh&to=en`)
          .then((r) => r.json())
          .then((d) => ({ k: `zh->en:${t}`, v: d.ok ? d.translated : null }))
      )
    )
      .then((results) => {
        const newCache = { ...getClientCache() };
        const newMap: Record<string, string> = { ...local };
        for (const { k, v } of results) {
          if (v) {
            newCache[k] = v;
            newMap[k] = v;
          }
        }
        setClientCache(newCache);
        setMap(newMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locale, texts.join("|")]);

  return { map, loading };
}