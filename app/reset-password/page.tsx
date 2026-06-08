"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { resetPassword, loading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("链接缺少 token, 请回到登录页重新申请");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    const r = await resetPassword(token, password);
    if (r.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } else {
      setError(r.error ?? "重置失败");
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex justify-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check className="h-6 w-6" />
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          密码已重置
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          正在为你自动登录, 即将跳转到首页…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-white shadow-glow">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          设置新密码
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          请输入你的新密码, 至少 8 位, 包含字母和数字
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            新密码
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            再次输入新密码
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

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-600 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          重置密码
        </button>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="text-primary-700 hover:underline dark:text-primary-300">
            返回首页
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
