"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, Check } from "lucide-react";

interface Sub {
  enabled: boolean;
  frequency: "weekly" | "monthly";
  topics: string[];
  lastSentAt: string | null;
}

const TOPIC_META: Record<string, { label: string; description: string }> = {
  new_chapters: { label: "新章节速递", description: "每周新增/更新的章节" },
  progress: { label: "学习进度回顾", description: "本周学习时长、完成章节、连续天数" },
  achievements: { label: "成就播报", description: "新获得的勋章、邀请的新同学" },
};

export function SettingsClient({ initial }: { initial: Sub }) {
  const [sub, setSub] = useState<Sub>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: Sub) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!r.ok) {
        const d = await r.json();
        setError(d.error ?? "保存失败");
        return;
      }
      setSub(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message ?? "网络错误");
    } finally {
      setBusy(false);
    }
  }

  function toggleTopic(topic: string) {
    const next = sub.topics.includes(topic) ? sub.topics.filter((t) => t !== topic) : [...sub.topics, topic];
    save({ ...sub, topics: next });
  }

  return (
    <div className="container max-w-2xl py-10">
      <Link href="/me" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到个人中心
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">账号设置</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        管理邮件简报、通知等偏好
      </p>

      {/* 邮件简报 */}
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-4 w-4 text-rose-500" /> 邮件简报
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="text-sm">{sub.enabled ? "已订阅" : "未订阅"}</span>
            <button
              onClick={() => save({ ...sub, enabled: !sub.enabled })}
              disabled={busy}
              className={`relative h-6 w-11 rounded-full transition ${sub.enabled ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${sub.enabled ? "left-5" : "left-0.5"}`} />
            </button>
          </label>
        </div>

        {sub.enabled && (
          <>
            <div className="mb-4">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">发送频率</span>
              <div className="mt-2 flex gap-2">
                {(["weekly", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => save({ ...sub, frequency: f })}
                    disabled={busy}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                      sub.frequency === f
                        ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950/30 dark:text-primary-300"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
                    }`}
                  >
                    {f === "weekly" ? "每周一上午 9:00" : "每月 1 号上午 9:00"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">订阅内容</span>
              <div className="mt-2 space-y-2">
                {Object.entries(TOPIC_META).map(([key, meta]) => {
                  const checked = sub.topics.includes(key);
                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                        checked ? "border-primary-200 bg-primary-50/30 dark:border-primary-800/40 dark:bg-primary-950/10" : "border-neutral-200 dark:border-neutral-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTopic(key)}
                        disabled={busy}
                        className="mt-0.5 h-4 w-4 rounded border-neutral-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{meta.label}</div>
                        <div className="text-xs text-neutral-500">{meta.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {sub.lastSentAt && (
          <p className="mt-4 text-xs text-neutral-500">
            上次发送: {new Date(sub.lastSentAt).toLocaleString("zh-CN")}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {saved && <p className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-600"><Check className="h-3 w-3" /> 已保存</p>}
        {busy && <p className="mt-3 inline-flex items-center gap-1 text-sm text-neutral-500"><Loader2 className="h-3 w-3 animate-spin" /> 保存中...</p>}
      </section>

      <p className="mt-6 text-center text-xs text-neutral-400">
        简报系统: <Link href="https://nodemailer.com" className="hover:underline">nodemailer</Link>
        {sub.enabled ? " · 已开启" : " · 已关闭"}
      </p>
    </div>
  );
}
