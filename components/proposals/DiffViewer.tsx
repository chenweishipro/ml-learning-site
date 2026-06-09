"use client";

import { useMemo } from "react";
import { Plus, Minus, FileText, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { diffLines, summarize, type DiffLine, type DiffSummary } from "@/lib/diff";

interface DiffViewerProps {
  oldText: string;
  newText: string;
  /** 限制展示的最多行数 (默认不限) */
  maxLines?: number;
  /** 紧凑模式 (用于卡片预览) */
  compact?: boolean;
  /** 文件名/标识 (展示在 header) */
  title?: string;
}

export function DiffViewer({ oldText, newText, maxLines, compact, title }: DiffViewerProps) {
  const { lines, summary } = useMemo(() => {
    const lines = diffLines(oldText, newText);
    const summary = summarize(lines);
    return { lines, summary };
  }, [oldText, newText]);

  if (compact) {
    return <CompactDiff lines={lines} summary={summary} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <DiffHeader summary={summary} title={title} />
      {lines.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          (无差异)
        </div>
      ) : (
        <div className="max-h-[600px] overflow-auto font-mono text-[12.5px] leading-[1.55]">
          {lines.map((d, i) => {
            if (maxLines && i >= maxLines) {
              return (
                <div
                  key={i}
                  className="border-t border-dashed border-neutral-200 bg-neutral-50 px-3 py-1.5 text-center text-[11px] italic text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40"
                >
                  ... 还有 {lines.length - maxLines} 行未显示 (使用 maxLines 参数限制)
                </div>
              );
            }
            return <DiffLineRow key={i} line={d} />;
          })}
        </div>
      )}
    </div>
  );
}

function CompactDiff({ lines, summary }: { lines: DiffLine[]; summary: DiffSummary }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="mb-2 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Plus className="h-3 w-3" />
          {summary.added}
        </span>
        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
          <Minus className="h-3 w-3" />
          {summary.removed}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">
          {summary.unchanged} 未变
        </span>
      </div>
      <div className="font-mono text-[11.5px] leading-[1.55]">
        {lines.slice(0, 8).map((d, i) => (
          <DiffLineRow key={i} line={d} compact />
        ))}
        {lines.length > 8 && (
          <div className="mt-1 text-center text-[10px] italic text-neutral-500">
            ... 还有 {lines.length - 8} 行
          </div>
        )}
      </div>
    </div>
  );
}

function DiffLineRow({ line, compact }: { line: DiffLine; compact?: boolean }) {
  const isAdd = line.type === "add";
  const isRemove = line.type === "remove";
  const isContext = line.type === "context";

  return (
    <div
      className={cn(
        "flex items-start gap-2 px-2",
        !compact && "border-l-2",
        isAdd && "border-l-emerald-400 bg-emerald-50/60 dark:border-l-emerald-700 dark:bg-emerald-950/20",
        isRemove && "border-l-rose-400 bg-rose-50/60 dark:border-l-rose-700 dark:bg-rose-950/20",
        isContext && "border-l-transparent"
      )}
    >
      <div
        className={cn(
          "w-10 flex-shrink-0 select-none py-0.5 text-right text-[10.5px] tabular-nums",
          isContext ? "text-neutral-400 dark:text-neutral-600" : "text-neutral-500 dark:text-neutral-400"
        )}
      >
        {line.oldLine ?? ""}
      </div>
      <div
        className={cn(
          "w-10 flex-shrink-0 select-none py-0.5 text-right text-[10.5px] tabular-nums",
          isContext ? "text-neutral-400 dark:text-neutral-600" : "text-neutral-500 dark:text-neutral-400"
        )}
      >
        {line.newLine ?? ""}
      </div>
      <div
        className={cn(
          "w-3 flex-shrink-0 select-none py-0.5 text-center font-bold",
          isAdd && "text-emerald-600 dark:text-emerald-400",
          isRemove && "text-rose-600 dark:text-rose-400",
          isContext && "text-neutral-300 dark:text-neutral-700"
        )}
      >
        {isAdd ? "+" : isRemove ? "-" : ""}
      </div>
      <pre
        className={cn(
          "min-w-0 flex-1 whitespace-pre-wrap break-words py-0.5",
          isAdd && "text-emerald-900 dark:text-emerald-100",
          isRemove && "text-rose-900 dark:text-rose-100",
          isContext && "text-neutral-700 dark:text-neutral-300"
        )}
      >
        {line.text || " "}
      </pre>
    </div>
  );
}

function DiffHeader({ summary, title }: { summary: DiffSummary; title?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/80 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        {title?.endsWith(".mdx") || title?.endsWith(".md") ? (
          <FileCode className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        <span className="truncate font-medium text-neutral-900 dark:text-neutral-50">{title ?? "变更"}</span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
          +{summary.added}
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 font-mono font-medium text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50">
          -{summary.removed}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">
          ({summary.unchanged} 未变)
        </span>
      </div>
    </div>
  );
}
