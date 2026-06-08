"use client";

import { useEffect, useRef, useState } from "react";
import katex from "katex";

interface MathProps {
  /** LaTeX 源码 (不含 $ 包裹) */
  tex: string;
  /** 是否块级显示 (默认 false = 行内) */
  block?: boolean;
  /** 错误时的回调, 用于降级显示纯文本 */
  onError?: (err: Error) => void;
  className?: string;
}

/**
 * KaTeX 数学公式组件
 * - 客户端渲染, 因为 KaTeX 在浏览器里跑
 * - 行内/块级两种模式
 * - 出错时降级显示原始 LaTeX 文本
 */
export function Math({ tex, block = false, className }: MathProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(tex, ref.current, {
        throwOnError: true,
        displayMode: block,
        output: "html",
        strict: "ignore",
      });
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (ref.current) {
        ref.current.textContent = tex;
      }
    }
  }, [tex, block]);

  if (error) {
    return (
      <code
        className={`rounded bg-red-50 px-1 py-0.5 font-mono text-xs text-red-600 dark:bg-red-950/30 dark:text-red-300 ${className ?? ""}`}
        title={error}
      >
        {tex}
      </code>
    );
  }

  return (
    <span
      ref={ref}
      className={className}
      style={block ? { display: "block", textAlign: "center", margin: "0.8em 0" } : undefined}
    />
  );
}

/** 行内公式快捷方式 */
export function M({ children, block = false }: { children: string; block?: boolean }) {
  return <Math tex={children} block={block} />;
}

/** 块级公式快捷方式 */
export function MBlock({ children }: { children: string }) {
  return <Math tex={children} block />;
}
