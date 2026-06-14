"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Trash2, User, Globe, Lock, Camera, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Initial {
  id: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  profilePublic: 0 | 1;
  role: string;
}

const PRESET_AVATARS = [
  "linear-gradient(135deg, hsl(0,70%,55%), hsl(30,70%,45%))",
  "linear-gradient(135deg, hsl(60,70%,50%), hsl(90,70%,40%))",
  "linear-gradient(135deg, hsl(180,70%,45%), hsl(210,70%,35%))",
  "linear-gradient(135deg, hsl(240,70%,55%), hsl(270,70%,45%))",
  "linear-gradient(135deg, hsl(300,70%,55%), hsl(330,70%,45%))",
  "linear-gradient(135deg, hsl(150,60%,40%), hsl(180,60%,30%))",
];

export function ProfileEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [profilePublic, setProfilePublic] = useState(initial.profilePublic);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // 上传图片 -> base64 data url (限 200K)
  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setMsg({ kind: "err", text: "请选择图片文件" });
      return;
    }
    if (f.size > 200 * 1024) {
      setMsg({ kind: "err", text: "图片需 < 200K" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(f);
  }

  function pickPreset(bg: string) {
    // 编码 preset 字符串
    setAvatarUrl(`preset:${bg}`);
  }

  function getAvatarBg(): { url: string | null; initial: string } {
    const name = displayName || initial.email.split("@")[0] || "?";
    if (!avatarUrl) {
      const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
      return {
        url: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},70%,45%))`,
        initial: name[0].toUpperCase(),
      };
    }
    if (avatarUrl.startsWith("preset:")) {
      return { url: avatarUrl.slice(7), initial: name[0].toUpperCase() };
    }
    return { url: avatarUrl, initial: name[0].toUpperCase() };
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl, profilePublic }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d?.error || "保存失败");
      setMsg({ kind: "ok", text: "已保存" });
      router.refresh();
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "保存失败" });
    } finally {
      setSaving(false);
    }
  }

  const { url: bg, initial: initial1 } = getAvatarBg();
  const isImg = bg && (bg.startsWith("data:") || bg.startsWith("http") || bg.startsWith("/"));

  return (
    <div className="space-y-6">
      {/* 头像 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Camera className="h-3.5 w-3.5" /> 头像
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-full text-2xl font-bold text-white ring-2 ring-neutral-200 dark:ring-neutral-700"
            style={isImg ? {} : { background: bg ?? undefined }}
          >
            {isImg ? (
              <img src={bg!} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              initial1
            )}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="file"
              accept="image/*"
              onChange={onUploadFile}
              className="block w-full text-sm text-neutral-700 file:mr-2 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-neutral-300 dark:file:bg-primary-950/30 dark:file:text-primary-300"
            />
            <p className="mt-1 text-xs text-neutral-500">支持 PNG/JPG, &lt; 200K</p>
          </div>
        </div>
        <div className="mt-3">
          <p className="mb-2 text-xs text-neutral-500">或选个渐变色:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_AVATARS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => pickPreset(bg)}
                className={cn(
                  "h-8 w-8 rounded-full ring-2 transition",
                  avatarUrl === `preset:${bg}` ? "ring-primary-600 scale-110" : "ring-transparent hover:ring-neutral-300"
                )}
                style={{ background: bg }}
                aria-label="preset"
              />
            ))}
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"
              >
                <Trash2 className="h-3 w-3" /> 重置
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 昵称 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <User className="h-3.5 w-3.5" /> 昵称
        </h2>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder={initial.email.split("@")[0]}
        />
        <p className="mt-1 text-xs text-neutral-500">中英文字母数字空格/_-. , 最多 40 字符</p>
      </section>

      {/* 简介 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-semibold">个人简介</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={4}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="一句话介绍下你自己, 比如正在学的方向 / 工作背景 / 学习目标"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
          <span>显示在公开主页上</span>
          <span>{bio.length} / 200</span>
        </div>
      </section>

      {/* 隐私 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-semibold">公开设置</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProfilePublic(1)}
            className={cn(
              "inline-flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
              profilePublic === 1
                ? "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300"
                : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            )}
          >
            <Globe className="h-3.5 w-3.5" /> 公开 (默认)
          </button>
          <button
            type="button"
            onClick={() => setProfilePublic(0)}
            className={cn(
              "inline-flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
              profilePublic === 0
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            )}
          >
            <Lock className="h-3.5 w-3.5" /> 仅自己可见
          </button>
        </div>
      </section>

      {/* 保存 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          保存
        </button>
        <Link href="/me/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400">
          <ArrowLeft className="h-3.5 w-3.5" /> 回到我的
        </Link>
        {msg && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm",
              msg.kind === "ok" ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {msg.kind === "ok" && <Check className="h-3.5 w-3.5" />} {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
