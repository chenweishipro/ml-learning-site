"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CodeBlockProps {
  /** 原始代码字符串 (不传 children 时使用) */
  code?: string;
  /** 直接传入 <pre><code> 子节点 */
  children?: ReactNode;
  /** 语言标签, 例如 "python" / "typescript" */
  language?: string;
  /** 文件名 (可选) */
  filename?: string;
  className?: string;
}

/**
 * 带语法高亮槽位的代码块。
 *  - 顶部有文件名 / 语言标签
 *  - 右上角一键复制按钮 (复制 children 的 textContent)
 *  - 真正的语法高亮由 MDX 渲染管线 (rehype-shiki) 接管;
 *    当作为独立组件使用时, 内容区只展示等宽字体的纯文本, 仍能保证美观。
 */
export function CodeBlock({
  code,
  children,
  language,
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = code ?? (typeof children === "string" ? children : "");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 某些浏览器在 HTTP 下无 clipboard 权限, 静默失败即可 */
    }
  };

  return (
    <div
      className={cn(
        "my-6 overflow-hidden rounded-lg border border-neutral-800/40 bg-neutral-950 text-neutral-100",
        "shadow-soft",
        className
      )}
    >
      {(filename || language) && (
        <div className="flex items-center justify-between border-b border-neutral-800/60 bg-neutral-900/60 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-neutral-400">
            {filename && <span>{filename}</span>}
            {language && !filename && <span className="uppercase">{language}</span>}
          </div>
          {language && filename && (
            <span className="rounded bg-primary-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary-300">
              {language}
            </span>
          )}
        </div>
      )}

      <div className="group relative">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center",
            "rounded-md bg-neutral-800/80 text-neutral-300 opacity-0 transition",
            "hover:bg-neutral-700 hover:text-white group-hover:opacity-100",
            copied && "opacity-100"
          )}
          aria-label={copied ? "已复制" : "复制代码"}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>

        <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
          {code !== undefined ? (
            <code className="font-mono">{code}</code>
          ) : (
            children
          )}
        </pre>
      </div>
    </div>
  );
}
