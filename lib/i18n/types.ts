// i18n types and constants (separate to avoid circular imports)
export type Locale = "zh" | "en";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "en", label: "English", nativeLabel: "English" },
];

export const DEFAULT_LOCALE: Locale = "zh";

export type Dictionary = Record<string, Record<string, string>>;

export function detectLocale(cookieHeader: string | null): Locale {
  if (!cookieHeader) return DEFAULT_LOCALE;
  const match = cookieHeader.match(/(?:^|;\s*)ml-site-locale=([^;]+)/);
  if (match) {
    const v = match[1] as Locale;
    if (v === "zh" || v === "en") return v;
  }
  return DEFAULT_LOCALE;
}
