"use client";

import { useEffect, useRef, useState } from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import {
  LinearRegressionViz,
  GradientDescent,
  KMeansViz,
  ConfusionMatrixViz,
  DecisionTreeViz,
  NeuralNetPlayground,
} from "@/components/interactive";
import { Math, M, MBlock } from "@/components/math";
import { Quiz } from "@/components/quiz";
import { PythonRunner } from "@/components/python-runner";
import { Loader2, AlertCircle } from "lucide-react";

interface MDXPreviewProps {
  source: string;
  /** 防抖毫秒数 */
  debounceMs?: number;
}

export function MDXPreview({ source, debounceMs = 600 }: MDXPreviewProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!source.trim()) {
      setMdxSource(null);
      setError(null);
      return;
    }

    setDirty(true);
    const t = setTimeout(async () => {
      // 取消上一次请求
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      try {
        const res = await fetch("/api/admin/preview/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ source }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "解析失败");
          setMdxSource(null);
          return;
        }
        setMdxSource(data.data.mdxSource);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "网络错误");
      } finally {
        setLoading(false);
        setDirty(false);
      }
    }, debounceMs);

    return () => clearTimeout(t);
  }, [source, debounceMs]);

  return (
    <div className="relative h-full">
      {/* 状态指示 */}
      <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 rounded-md border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        {loading || dirty ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
            <span className="text-neutral-500 dark:text-neutral-400">渲染中…</span>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-red-600 dark:text-red-400">解析失败</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-neutral-500 dark:text-neutral-400">已渲染</span>
          </>
        )}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs">{error}</pre>
        </div>
      ) : mdxSource ? (
        <div className="prose-chinese rounded-md border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <MDXRemote
            {...mdxSource}
            components={{
              Callout,
              CodeBlock,
              LinearRegressionViz,
              GradientDescent,
              KMeansViz,
              ConfusionMatrixViz,
              DecisionTreeViz,
              NeuralNetPlayground,
              Math,
              M,
              MBlock,
              Quiz,
              PythonRunner,
              pre: (props) => <CodeBlock>{props.children}</CodeBlock>,
            }}
          />
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          在左侧编辑器输入内容, 这里会实时预览渲染效果。
        </div>
      )}
    </div>
  );
}
