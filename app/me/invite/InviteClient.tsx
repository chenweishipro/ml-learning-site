"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Gift, Plus, Users, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface Code { code: string; used: boolean; createdAt: string; usedAt: string | null; }
interface Invitee { id: string; displayName: string; avatarUrl: string | null; bio: string | null; joinedAt: string; invitedAt: string; }

const MAX_PER_USER = 10;

export function InviteClient({ initialCodes, invitees }: { initialCodes: Code[]; invitees: Invitee[] }) {
  const [codes, setCodes] = useState<Code[]>(initialCodes);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/register/` : "";

  async function gen() {
    setBusy(true);
    try {
      const r = await fetch("/api/invite", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate" }) });
      const d = await r.json();
      if (r.ok) setCodes((c) => [{ code: d.code, used: false, createdAt: new Date().toISOString(), usedAt: null }, ...c]);
      else alert(d.error ?? "生成失败");
    } finally { setBusy(false); }
  }

  async function copy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  async function share(code: string) {
    const text = `我在 ML 学习站, 一起来学机器学习!\n注册时填邀请码 ${code} 双方都得徽章 🌱\n${shareUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: "ML 学习站邀请", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    }
  }

  const total = codes.length;
  const used = codes.filter((c) => c.used).length;
  const remaining = MAX_PER_USER - total;

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/me" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到个人中心
      </Link>
      <div className="mt-2 mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Gift className="h-7 w-7 text-rose-500" />
          邀请好友
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          生成专属邀请码分享给朋友, 双方均可获得专属徽章。
        </p>
      </div>

      {/* 战果 + 动作 */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">{total}</div>
            <div className="mt-0.5 text-xs text-neutral-500">已生成</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{used}</div>
            <div className="mt-0.5 text-xs text-neutral-500">已邀请</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{remaining}</div>
            <div className="mt-0.5 text-xs text-neutral-500">剩余 (上限 {MAX_PER_USER})</div>
          </CardContent>
        </Card>
      </div>

      {/* 邀请码列表 + 生成 */}
      <Card className="mb-6">
        <CardContent className="py-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">我的邀请码</h2>
            <Button size="sm" onClick={gen} disabled={busy || remaining === 0}>
              <Plus className="h-3.5 w-3.5" /> 生成新码
            </Button>
          </div>

          {codes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
              还没有邀请码, 点上方按钮生成一个吧
            </div>
          ) : (
            <ul className="space-y-2">
              {codes.map((c) => (
                <li key={c.code} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 transition",
                  c.used
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/30 dark:bg-emerald-950/10"
                    : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                )}>
                  <code className="flex-1 font-mono text-lg font-bold tracking-wider text-primary-700 dark:text-primary-300">
                    {c.code}
                  </code>
                  {c.used ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      {c.usedAt && new Date(c.usedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => copy(c.code)}>
                        {copied === c.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === c.code ? "已复制" : "复制"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => share(c.code)}>
                        <Share2 className="h-3.5 w-3.5" /> 分享
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 邀请奖励说明 */}
      <Card className="mb-6 border-violet-200 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/30 dark:border-violet-800/40 dark:from-violet-950/20 dark:to-fuchsia-950/20">
        <CardContent className="py-4">
          <h3 className="flex items-center gap-1.5 font-semibold text-violet-800 dark:text-violet-200">
            <Sparkles className="h-4 w-4" /> 邀请奖励
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            <li>🌱 <strong>新种子</strong> (新用户): 凭借邀请码注册即得</li>
            <li>🌟 <strong>破冰者</strong> (邀请人): 成功邀请 3 人</li>
            <li>💫 <strong>分享者</strong> (邀请人): 成功邀请 10 人</li>
            <li>👑 <strong>大使</strong> (邀请人): 成功邀请 30 人</li>
          </ul>
        </CardContent>
      </Card>

      {/* 已邀请列表 */}
      <Card>
        <CardContent className="py-5">
          <h2 className="mb-3 flex items-center gap-1.5 font-semibold">
            <Users className="h-4 w-4" /> 你邀请的人 ({invitees.length})
          </h2>
          {invitees.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
              还没有人通过你的邀请加入, 分享出去吧!
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {invitees.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 text-sm font-semibold text-white">
                    {(u.displayName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${u.id}/`} className="font-medium hover:underline">{u.displayName}</Link>
                    {u.bio && <p className="truncate text-xs text-neutral-500">{u.bio}</p>}
                  </div>
                  <div className="text-xs text-neutral-500">
                    入驻 {new Date(u.invitedAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...args: string[]) { return args.filter(Boolean).join(" "); }
