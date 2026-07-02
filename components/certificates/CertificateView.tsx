"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ShareButton } from "@/components/share-button";

interface CertificateData {
  id: string;
  serialNo: string;
  courseSlug: string;
  courseTitle: string;
  issuedAt: string;
  finalScore: number;
  user: {
    email: string;
    displayName: string | null;
  };
}

interface CertificateSVGProps {
  displayName: string;
  courseTitle: string;
  dateStr: string;
  serialNo: string;
  finalScore: number;
}

const CertificateSVG = forwardRef<SVGSVGElement, CertificateSVGProps>(
  ({ displayName, courseTitle, dateStr, serialNo, finalScore }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 850"
      width="1200"
      height="850"
      style={{ display: "block", maxWidth: "100%", height: "auto" }}
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="50%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fde68a" strokeWidth="0.5" />
        </pattern>
      </defs>

      <rect width="1200" height="850" fill="url(#bg)" />
      <rect width="1200" height="850" fill="url(#grid)" />

      <rect x="30" y="30" width="1140" height="790" fill="none" stroke="url(#border)" strokeWidth="6" rx="8" />
      <rect x="55" y="55" width="1090" height="740" fill="none" stroke="url(#border)" strokeWidth="1.5" strokeDasharray="4,4" rx="4" />

      <g transform="translate(600, 130)">
        <circle r="42" fill="url(#seal)" />
        <path d="M -18 0 L -8 12 L 12 -10 L 8 14 L 22 4 L 6 22 L -6 8 Z" fill="#fff" opacity="0.95" transform="rotate(45)" />
      </g>

      <text x="600" y="220" textAnchor="middle" fontFamily="ui-serif, Georgia, serif" fontSize="56" fontWeight="700" fill="#92400e" letterSpacing="6">
        完课证书
      </text>
      <text x="600" y="252" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="16" fill="#a16207" letterSpacing="3">
        Certificate of Completion
      </text>

      <text x="600" y="320" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="18" fill="#78350f">
        兹证明
      </text>

      <text x="600" y="400" textAnchor="middle" fontFamily="ui-serif, Georgia, serif" fontSize="64" fontWeight="700" fill="#451a03" letterSpacing="2">
        {displayName}
      </text>
      <line x1="300" y1="420" x2="900" y2="420" stroke="#a16207" strokeWidth="1" opacity="0.4" />

      <text x="600" y="475" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="20" fill="#78350f">
        已完成 ML 学习站课程
      </text>
      <text x="600" y="525" textAnchor="middle" fontFamily="ui-serif, Georgia, serif" fontSize="36" fontWeight="700" fill="#7c2d12">
        《{courseTitle}》
      </text>
      <text x="600" y="565" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="16" fill="#a16207">
        成绩 {finalScore.toFixed(0)} · 特此颁发, 以资鼓励
      </text>

      <text x="220" y="720" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="14" fill="#78350f">
        颁发日期
      </text>
      <text x="220" y="745" textAnchor="middle" fontFamily="ui-serif, Georgia, serif" fontSize="22" fill="#451a03">
        {dateStr}
      </text>
      <line x1="120" y1="755" x2="320" y2="755" stroke="#92400e" strokeWidth="1.5" />

      <text x="980" y="720" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="14" fill="#78350f">
        证书编号
      </text>
      <text x="980" y="745" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="18" fill="#451a03">
        {serialNo}
      </text>
      <line x1="850" y1="755" x2="1110" y2="755" stroke="#92400e" strokeWidth="1.5" />

      <g transform="translate(600, 745)">
        <circle r="55" fill="url(#seal)" opacity="0.95" />
        <circle r="45" fill="none" stroke="#fff" strokeWidth="1.5" />
        <text textAnchor="middle" y="-5" fontFamily="ui-serif, Georgia, serif" fontSize="14" fontWeight="700" fill="#fff" letterSpacing="2">
          ML 学习站
        </text>
        <text textAnchor="middle" y="14" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="8" fill="#fff" letterSpacing="2">
          ML · STUDY
        </text>
        <text textAnchor="middle" y="28" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="7" fill="#fef3c7">
          CERTIFIED
        </text>
      </g>
    </svg>
  )
);
CertificateSVG.displayName = "CertificateSVG";

export { CertificateSVG };
export type { CertificateData };

// 完整页面组件
export function CertificateView({ serialNo }: { serialNo: string }) {
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/certificates/${serialNo}/`);
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "证书不存在");
          return;
        }
        setCert(data.data.certificate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "网络错误");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [serialNo]);

  const downloadPng = useCallback(async () => {
    if (!svgRef.current) return;
    setDownloading(true);
    try {
      const svg = svgRef.current;
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("加载 SVG 失败"));
        img.src = url;
      });

      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = 1200 * scale;
      canvas.height = 850 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 不支持");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = `ML证书-${cert?.courseSlug ?? "course"}-${serialNo}.png`;
        a.click();
        URL.revokeObjectURL(dlUrl);
        URL.revokeObjectURL(url);
        setDownloading(false);
      }, "image/png");
    } catch (e) {
      setError(e instanceof Error ? e.message : "下载失败");
      setDownloading(false);
    }
  }, [serialNo, cert]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (loading) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error ?? "证书不存在"}
        </div>
        <Link href="/me/" className="mt-4 inline-block text-sm text-primary-700 hover:underline">
          ← 返回个人中心
        </Link>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt);
  const dateStr = issuedDate.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/me/"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回个人中心
        </Link>
        <div className="flex items-center gap-2">
          <ShareButton
            title={`我的 ML 学习证书 — ${cert.courseTitle}`}
            text={`我刚完成 ${cert.courseTitle} 课程, 获得 ${cert.finalScore} 分!`}
            variant="outline"
          />
          <button
            onClick={downloadPng}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            {downloading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                下载 PNG
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50">
          <Sparkles className="h-3 w-3" />
          已颁发 · 可下载分享
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-2xl dark:border-amber-800/50">
          <CertificateSVG
            ref={svgRef}
            displayName={cert.user.displayName ?? cert.user.email.split("@")[0]}
            courseTitle={cert.courseTitle}
            dateStr={dateStr}
            serialNo={cert.serialNo}
            finalScore={cert.finalScore}
          />
        </div>

        <div className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
          证书编号: <code className="font-mono">{cert.serialNo}</code> · 颁发于 {dateStr}
        </div>
      </div>
    </div>
  );
}
