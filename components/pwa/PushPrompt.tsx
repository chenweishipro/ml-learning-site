/** PWA 推送通知客户端组件 — 提示用户订阅 + 注册 service worker */
"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

const STORAGE_KEY = "push-dismissed-at";
const DISMISS_HOURS = 24; // 用户关闭后, 24 小时内不再提示

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushPrompt() {
  const [state, setState] = useState<"loading" | "supported" | "unsupported" | "subscribed" | "denied" | "dismissed">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    // 检查已订阅
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setState("subscribed");
        else if (Notification.permission === "granted") setState("supported");
        else {
          // 检查是否最近被 dismiss
          const dismissed = localStorage.getItem(STORAGE_KEY);
          if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_HOURS * 3600 * 1000) {
            setState("dismissed");
          } else {
            setState("supported");
          }
        }
      })
      .catch(() => setState("supported"));
  }, []);

  const subscribe = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      // 拿 VAPID 公钥
      const r = await fetch("/api/push/subscribe", { credentials: "include" });
      if (!r.ok) throw new Error("无法获取公钥");
      const { publicKey } = await r.json();
      if (!publicKey) throw new Error("公钥缺失");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      // 发送到服务端保存
      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!save.ok) {
        const e = await save.json().catch(() => ({}));
        throw new Error(e.error || "保存订阅失败");
      }
      setState("subscribed");
    } catch (e) {
      console.error("[PushPrompt] subscribe failed", e);
      setState("denied");
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setState("supported");
        return;
      }
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      setState("supported");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setState("dismissed");
  };

  if (state === "loading" || state === "dismissed" || state === "unsupported") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
          {state === "subscribed" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {state === "subscribed" ? (
            <>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">通知已开启</p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                新章节上线、错题批改时我们会通知你。
              </p>
              <button
                type="button"
                onClick={unsubscribe}
                disabled={busy}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <BellOff className="h-3 w-3" />}
                关闭通知
              </button>
            </>
          ) : state === "denied" ? (
            <>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">通知被禁用</p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                如需开启, 请在浏览器设置中允许本站通知。
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="mt-2 text-xs text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                我知道了
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">开启学习通知？</p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                新章节上线、章末小测验、AI 摘要更新时提醒你。
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={subscribe}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
                  开启
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-md px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  稍后
                </button>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭提示"
          className="-m-1 grid h-7 w-7 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}