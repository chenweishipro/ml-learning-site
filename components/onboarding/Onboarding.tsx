"use client";

/**
 * v20.1 Onboarding Tour — 5 步引导
 *
 * 步骤:
 *  1. 选学习方向 (auto-redirect to /me/learning-path/)
 *  2. 安装 PWA (显示 iOS/Android 指引)
 *  3. 启用通知 (调用 Push 订阅)
 *  4. 进入第一课
 *  5. 完成
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Check, Sparkles, Target, Bell, Smartphone, GraduationCap, X } from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: Target,
    title: "选学习方向",
    desc: "我是 ML 工程师 / 数据分析师 / 研究员 / 通用?  选好后,系统给你定制 3-6 个月学习路径。",
    cta: { label: "去选方向", href: "/me/learning-path/" },
  },
  {
    id: 2,
    icon: Smartphone,
    title: "把 ML 学习站装到桌面",
    desc: "支持 PWA 离线访问, 通勤路上、地铁里都能学。",
    cta: null,
  },
  {
    id: 3,
    icon: Bell,
    title: "开启学习提醒",
    desc: "每天定时推一条, 帮你保持节奏 (可随时关掉)。",
    cta: null,
  },
  {
    id: 4,
    icon: BookOpen,
    title: "进入第一课",
    desc: "推荐先看《机器学习入门》, 中文友好 + 可运行代码, 5 分钟上手。",
    cta: { label: "开始学习", href: "/courses/ml-basics/what-is-ml/" },
  },
  {
    id: 5,
    icon: Sparkles,
    title: "完成!",
    desc: "你已经设好学习方向 + 装上 PWA + 开启提醒。回去看 /me 仪表板, 你的进度都在那里。",
    cta: { label: "去 /me 看看", href: "/me/" },
  },
];

export interface OnboardingProps {
  step: number; // 0 = not started, 5 = done
  isLoggedIn: boolean;
}

export function Onboarding({ step, isLoggedIn }: OnboardingProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(step);
  const [pwaSupported, setPwaSupported] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pushStatus, setPushStatus] = useState<"idle" | "subscribing" | "done" | "error">("idle");

  useEffect(() => {
    if (step > 0 && step < 5 && isLoggedIn) {
      setOpen(true);
      setCurrent(step);
    }
    // PWA install prompt
    if (typeof window !== "undefined") {
      setPwaSupported(true);
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, [step, isLoggedIn]);

  if (!open || !isLoggedIn) return null;

  const stepDef = STEPS[current - 1];
  if (!stepDef) return null;
  const Icon = stepDef.icon;
  const isLast = current === STEPS.length;

  async function next() {
    if (current === 2) {
      // PWA install
      if (deferredPrompt) {
        try {
          await deferredPrompt.prompt();
          await deferredPrompt.userChoice;
        } catch (e) {}
      }
    }
    if (current === 3) {
      // Push subscribe
      setPushStatus("subscribing");
      try {
        const reg = await navigator.serviceWorker?.ready;
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (!sub) {
            const r = await fetch("/api/push/subscribe/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({}),
            });
            if (r.ok) setPushStatus("done");
            else setPushStatus("error");
          } else {
            setPushStatus("done");
          }
        } else {
          setPushStatus("error");
        }
      } catch (e) {
        setPushStatus("error");
      }
    }

    const nextStep = current + 1;
    setCurrent(nextStep);
    try {
      await fetch("/api/onboarding/state/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ step: nextStep }),
      });
    } catch (e) {}
    if (nextStep > STEPS.length) {
      setOpen(false);
      router.refresh();
    }
  }

  function dismiss() {
    setOpen(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        onClick={(e) => e.target === e.currentTarget && dismiss()}
      >
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          {/* progress bar */}
          <div className="flex gap-1 p-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s.id <= current ? "bg-primary-500" : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              />
            ))}
          </div>

          <button
            onClick={dismiss}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
            aria-label="关闭引导"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 pt-2">
            {/* icon */}
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 text-white shadow-soft">
              <Icon className="h-7 w-7" />
            </div>

            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
              第 {current} / {STEPS.length} 步
            </div>
            <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-neutral-50">
              {stepDef.title}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {stepDef.desc}
            </p>

            {/* 步骤 3: 推送状态反馈 */}
            {current === 3 && pushStatus !== "idle" && (
              <div
                className={`mb-4 rounded-lg p-3 text-xs ${
                  pushStatus === "done"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : pushStatus === "subscribing"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                }`}
              >
                {pushStatus === "done" && "✅ 通知已开启!"}
                {pushStatus === "subscribing" && "⏳ 正在订阅…"}
                {pushStatus === "error" && "⚠️ 当前浏览器不支持 (可以稍后在设置里开)"}
              </div>
            )}

            {/* 步骤 2: PWA 提示 */}
            {current === 2 && !deferredPrompt && pwaSupported && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                💡 提示: 在浏览器菜单里选「添加到主屏幕」即可。点击下方「下一步」继续。
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={dismiss}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                稍后再说
              </button>
              <div className="flex gap-2">
                {stepDef.cta && !isLast && (
                  <Link
                    href={stepDef.cta.href}
                    onClick={next}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    {stepDef.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <button
                  onClick={next}
                  className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
                >
                  {isLast ? "完成" : current === 4 ? "开始第一课" : "下一步"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
