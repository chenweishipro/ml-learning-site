"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Eye, EyeOff, GraduationCap, Check } from "lucide-react";
import { useAuth } from "./auth-provider";

type Mode = "login" | "register" | "forgot";

export function AuthModal() {
  const { authModalOpen, authModalMode, setAuthModalOpen, login, register, requestPasswordReset, loading } =
    useAuth();

  const [mode, setMode] = useState<Mode>(authModalMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode);
      setError(null);
      setForgotSent(false);
    }
  }, [authModalOpen, authModalMode]);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [authModalOpen, setAuthModalOpen]);

  if (!authModalOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      const r = await login(email, password);
      if (r.ok) setAuthModalOpen(false);
      else setError(r.error ?? "登录失败");
    } else if (mode === "register") {
      if (password !== confirm) {
        setError("两次输入的密码不一致");
        return;
      }
      const r = await register(email, password, displayName || undefined);
      if (r.ok) setAuthModalOpen(false);
      else setError(r.error ?? "注册失败");
    } else if (mode === "forgot") {
      const r = await requestPasswordReset(email);
      if (r.ok) setForgotSent(true);
      else setError(r.error ?? "请求失败");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-card sm:p-8 dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setAuthModalOpen(false)}
          aria-label="关闭"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            {mode === "login" && "登录到 ML 学习站"}
            {mode === "register" && "创建账号"}
            {mode === "forgot" && "找回密码"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {mode === "login" && "欢迎回来, 继续你的学习之旅"}
            {mode === "register" && "免费注册, 同步你的学习进度"}
            {mode === "forgot" && "输入邮箱, 我们给你发重置链接"}
          </p>
        </div>

        {forgotSent ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <strong className="font-semibold">如果该邮箱已注册, 重置链接已发出。</strong>
                <p className="mt-1 text-emerald-700/80 dark:text-emerald-300/80">
                  请到邮箱查收(可能在垃圾邮件里),链接 1 小时内有效。
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              知道了
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  昵称(可选)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="想让我们怎么称呼你?"
                  className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500 dark:focus:ring-primary-900"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                邮箱
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500 dark:focus:ring-primary-900"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "至少 8 位, 字母+数字" : "你的密码"}
                    className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 pr-10 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500 dark:focus:ring-primary-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "隐藏密码" : "显示密码"}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  再次输入密码
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500 dark:focus:ring-primary-900"
                />
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-600 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" && "登录"}
              {mode === "register" && "创建账号"}
              {mode === "forgot" && "发送重置链接"}
            </button>
          </form>
        )}

        {!forgotSent && (
          <div className="mt-5 flex flex-col gap-2 border-t border-neutral-100 pt-4 text-center text-sm dark:border-neutral-800">
            {mode === "login" && (
              <>
                <button
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-primary-700 hover:underline dark:text-primary-300"
                >
                  还没有账号?立即注册
                </button>
                <button
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  忘记密码?
                </button>
              </>
            )}
            {mode === "register" && (
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-primary-700 hover:underline dark:text-primary-300"
              >
                已有账号?返回登录
              </button>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-primary-700 hover:underline dark:text-primary-300"
              >
                想起来了?返回登录
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
