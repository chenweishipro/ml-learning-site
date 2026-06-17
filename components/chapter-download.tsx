"use client";
import { useState } from "react";
import { Download, FileText, FileCode, FileType2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterDownloadProps {
  courseSlug: string;
  chapterSlug: string;
  chapterTitle: string;
}

type Format = "md" | "text" | "html";

const FORMATS: { id: Format; label: string; icon: typeof FileText; desc: string }[] = [
  { id: "md", label: "Markdown", icon: FileCode, desc: "原始格式, 可粘贴到笔记" },
  { id: "text", label: "纯文本", icon: FileText, desc: ".txt, 方便复制" },
  { id: "html", label: "HTML", icon: FileType2, desc: "可浏览器打开或打印 PDF" },
];

export function ChapterDownload({ courseSlug, chapterSlug, chapterTitle }: ChapterDownloadProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Format | null>(null);

  async function onDownload(fmt: Format) {
    setBusy(fmt);
    setOpen(false);
    try {
      const url = `/api/chapter/export?slug=${encodeURIComponent(courseSlug)}&chapter=${encodeURIComponent(chapterSlug)}&format=${fmt}`;
      // 触发下载
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chapterSlug}.${fmt === "text" ? "txt" : fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => setBusy(null), 800);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        下载
      </button>

      {open && (
        <>
          {/* 点击外部关闭 */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              {chapterTitle.slice(0, 20)}{chapterTitle.length > 20 ? "…" : ""}
            </div>
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => onDownload(f.id)}
                disabled={busy !== null}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
                  "hover:bg-neutral-50 dark:hover:bg-neutral-800",
                  busy === f.id && "opacity-50"
                )}
              >
                <f.icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neutral-500" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{f.label}</div>
                  <div className="text-[10px] text-neutral-500">{f.desc}</div>
                </div>
              </button>
            ))}
            <div className="border-t border-neutral-100 px-2 py-1.5 text-[10px] text-neutral-400 dark:border-neutral-800">
              复制 / 打印 / 离线存档
            </div>
          </div>
        </>
      )}
    </div>
  );
}
