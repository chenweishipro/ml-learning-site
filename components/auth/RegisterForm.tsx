"use client";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, UserPlus, Gift } from "lucide-react";

export function RegisterForm() {
  const { register, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get("invite") ?? "");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, displayName, inviteCode || undefined);
      router.push("/me/");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "注册失败");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">昵称 (可选)</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="匿名学员"
        />
      </label>
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
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </label>
      <label className="block">
        <span className="flex items-center gap-1 text-sm text-neutral-700 dark:text-neutral-300">
          <Gift className="h-3 w-3" />
          邀请码 <span className="text-[10px] text-neutral-400">(可选, 填了双方得徽章)</span>
        </span>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wider dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="如 ML2X4Y"
          maxLength={12}
        />
      </label>
      {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
        注册
      </button>
    </form>
  );
}
