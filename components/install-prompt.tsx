"use client";
import { useEffect, useState } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "ml-site-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 已安装 (standalone) → 不显示
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    // 用户已关过 → 不再提示 (7 天内)
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const ts = Number(dismissed);
      if (Date.now() - ts < 7 * 86400_000) return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      // 延迟 30s 弹, 避免打扰首次访问
      setTimeout(() => setVisible(true), 30_000);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed || !visible || !evt) return null;

  async function onInstall() {
    if (!evt) return;
    setVisible(false);
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "dismissed") {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } else {
        setInstalled(true);
      }
    } catch {
      setVisible(false);
    }
  }

  function onDismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-primary-200 bg-white p-4 shadow-2xl dark:border-primary-800/50 dark:bg-neutral-900">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">安装 ML 学习站</h3>
            <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              离线阅读章节, 像原生 App 一样打开
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            aria-label="关闭"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onInstall}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Download className="h-3.5 w-3.5" />
            安装
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            下次再说
          </button>
        </div>
      </div>
    </div>
  );
}
