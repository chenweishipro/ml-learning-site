"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { zh } from "../i18n-dict-zh";
import { en } from "../i18n-dict-en";
import { DEFAULT_LOCALE, LOCALES, type Locale, type Dictionary } from "./types";

const DICTIONARIES: Record<Locale, Dictionary> = { zh, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  ready: boolean;
  /** 取词: t("nav.home") */
  t: (key: string, fallback?: string) => string;
  /** 取词并支持 {var} 占位符替换: t("foo.bar", "{name}你好", { name: "世界" }) */
  tf: (key: string, vars: Record<string, string | number>, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(d: Dictionary, key: string): string | undefined {
  const [ns, ...rest] = key.split(".");
  if (!ns) return undefined;
  let cur: any = d[ns];
  for (const r of rest) {
    if (cur == null) return undefined;
    cur = cur[r];
  }
  return typeof cur === "string" ? cur : undefined;
}

function setCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `ml-site-locale=${locale}; path=/; max-age=${oneYear}; samesite=lax`;
  try {
    localStorage.setItem("ml-site-locale", locale);
  } catch {}
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem("ml-site-locale") as Locale | null;
    if (stored === "zh" || stored === "en") return stored;
  } catch {}
  // 也读 cookie
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|;\s*)ml-site-locale=([^;]+)/);
    if (m) {
      const v = m[1] as Locale;
      if (v === "zh" || v === "en") return v;
    }
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initial ?? DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!initial) {
      setLocaleState(getInitialLocale());
    }
    setReady(true);
  }, [initial]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setCookie(l);
    // 不刷新, 仅切字典, 避免路由丢失
  }, []);

  const dict = DICTIONARIES[locale];

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return lookup(dict, key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key) ?? fallback ?? key;
    },
    [dict]
  );

  const tf = useCallback(
    (key: string, vars: Record<string, string | number>, fallback?: string): string => {
      let s = lookup(dict, key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key) ?? fallback ?? key;
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
      return s;
    },
    [dict]
  );

  const value = useMemo(() => ({ locale, setLocale, t, tf, ready }), [locale, setLocale, t, tf, ready]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // SSR / 测试场景: 返回默认 locale
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, fb?: string) => lookup(DICTIONARIES[DEFAULT_LOCALE], key) ?? fb ?? key,
      tf: (key: string, vars: Record<string, string | number>, fb?: string) => {
        let s = lookup(DICTIONARIES[DEFAULT_LOCALE], key) ?? fb ?? key;
        for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
        return s;
      },
      ready: false,
    };
  }
  return ctx;
}

export { LOCALES, DEFAULT_LOCALE };
export type { Locale, Dictionary };
