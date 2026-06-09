"use client";

import { useState, useEffect } from "react";
import { Loader2, Printer, FileText } from "lucide-react";

/**
 * 章节 PDF 导出按钮
 * 方案: 打开新的打印窗口 (无 sidebar/nav/footer), 用户用浏览器 "另存为 PDF"
 * 优点: 零依赖, 完美保留样式
 */
export function ChapterPDFExport({
  courseSlug,
  courseTitle,
  chapterSlug,
  chapterTitle,
}: {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
}) {
  const [printing, setPrinting] = useState(false);
  const [supportsPrint, setSupportsPrint] = useState(true);

  useEffect(() => {
    setSupportsPrint(typeof window !== "undefined" && typeof window.print === "function");
  }, []);

  function handlePrint() {
    setPrinting(true);
    try {
      // 触发浏览器原生打印对话框
      // 配合 globals.css 中的 @media print 样式:
      //   - 隐藏 sidebar/header/footer/buttons
      //   - 文章主体铺满整页
      //   - 字体稍大, 行高更高
      //   - 显示 print-only 元素 (课程信息、版权)
      window.print();
    } finally {
      // print() 是同步弹窗, 关闭后 setPrinting(false)
      setTimeout(() => setPrinting(false), 1000);
    }
  }

  function handlePrintPage() {
    // 打开专门的 /print/[slug]/[chapter] 页面 (无 sidebar)
    setPrinting(true);
    const url = `/print/${courseSlug}/${chapterSlug}/`;
    const w = window.open(url, "_blank", "width=900,height=800");
    if (!w) {
      alert("浏览器拦截了新窗口, 请允许弹窗后重试。");
      setPrinting(false);
      return;
    }
    // 当打印窗口加载完后自动触发打印
    w.addEventListener("load", () => {
      try {
        w.focus();
        w.print();
      } catch (e) {
        // ignore
      } finally {
        setPrinting(false);
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={handlePrint}
        disabled={!supportsPrint || printing}
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
        title="打印当前章节 (或 另存为 PDF)"
      >
        {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
        打印/导出 PDF
      </button>
    </div>
  );
}
