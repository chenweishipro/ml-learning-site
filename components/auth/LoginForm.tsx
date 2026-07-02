"use client";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      router.push("/me/");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "登录失败");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">邮箱</span>
        <div className="relative mt-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="you@example.com"
          />
        </div>
      </label>
      <label className="block">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">密码</span>
        <div className="relative mt-1">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type={showPw ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white py-2 pl-9 pr-9 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
            {showPw ? "隐藏" : "显示"}
          </button>
        </div>
      </label>
      {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      <div className="flex items-center justify-between text-xs">
        <Link href="/reset-password/" className="text-neutral-500 hover:underline">忘记密码</Link>
      </div>
      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
        登录
      </button>
    </form>
  );
}
