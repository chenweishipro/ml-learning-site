"use client";
import { useState } from "react";
import { Share2, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** 分享标题 */
  title: string;
  /** 分享文字 (描述) */
  text?: string;
  /** 完整 URL (不传则用当前 URL) */
  url?: string;
  /** 按钮变体 */
  variant?: "outline" | "primary" | "ghost";
  /** 自定义 class */
  className?: string;
  /** 小尺寸 (icon-only) */
  iconOnly?: boolean;
}

export function ShareButton({ title, text, url, variant = "outline", className, iconOnly = false }: ShareButtonProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  async function onShare() {
    setBusy(true);
    setErr(false);
    try {
      // 优先 navigator.share (移动端原生分享面板)
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: text ?? title,
          url: shareUrl,
        });
        setBusy(false);
        return;
      }
      // fallback 1: navigator.clipboard.writeText
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setBusy(false);
        return;
      }
      // fallback 2: 旧 execCommand
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // 用户取消分享不算错
      if (e instanceof Error && /abort|cancel/i.test(e.message)) {
        setBusy(false);
        return;
      }
      setErr(true);
      setTimeout(() => setErr(false), 2000);
    }
    setBusy(false);
  }

  const variantClasses = {
    outline:
      "border border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/30 dark:hover:text-primary-300",
    primary:
      "border border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300 hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-950/50",
    ghost:
      "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
  } as const;

  return (
    <button
      onClick={onShare}
      disabled={busy}
      title={copied ? "已复制!" : err ? "复制失败" : "分享"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
        iconOnly && "px-2",
        variantClasses[variant],
        busy && "opacity-60",
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : err ? (
        <Copy className="h-3.5 w-3.5 text-red-500" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {!iconOnly && (
        <span>
          {copied ? "已复制" : err ? "失败" : "分享"}
        </span>
      )}
    </button>
  );
}
