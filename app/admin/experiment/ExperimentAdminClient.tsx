"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Beaker, Loader2, Plus, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

interface Variant { id: string; name: string; value?: string; weight: number; }
interface Experiment {
  id: string;
  key: string;
  name: string;
  description: string | null;
  variants: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  createdBy: { id: string; displayName: string | null; email: string };
  _count: { events: number };
}

interface VariantStat {
  name: string;
  impression: number;
  click: number;
  conversion: number;
  ctr: string;
  cvr: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: "草稿",   color: "bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700" },
  running:   { label: "运行中", color: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50" },
  paused:    { label: "已暂停", color: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50" },
  completed: { label: "已完成", color: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/50" },
};

export function ExperimentAdminClient() {
  const { user, ready } = useAuth();
  const [data, setData] = useState<{ experiments: Experiment[]; stats: Record<string, any> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // form
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<Variant[]>([
    { id: "a", name: "A 对照", weight: 50 },
    { id: "b", name: "B 实验", weight: 50 },
  ]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (user && (user.role === "admin" || user.role === "superadmin")) load();
    else setLoading(false);
  }, [ready, user]);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/experiment/");
    const j = await r.json();
    if (j.ok) setData(j.data);
    setLoading(false);
  }

  async function create(status: "draft" | "running") {
    if (!key.trim() || !name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/experiment/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), name: name.trim(), description, variants, status }),
      });
      const j = await r.json();
      if (j.ok) {
        setShowCreate(false);
        setKey(""); setName(""); setDescription("");
        setVariants([{ id: "a", name: "A 对照", weight: 50 }, { id: "b", name: "B 实验", weight: 50 }]);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="container py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" /></div>;

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return (
      <div className="container py-12">
        <Link href="/admin/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="h-3.5 w-3.5" /> 回到 admin
        </Link>
        <p className="mt-6 text-center text-sm text-neutral-500">无权限</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-700">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到 admin
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Beaker className="h-7 w-7 text-primary-600" />
            A/B 测试
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            创建实验, 系统按 userId 哈希分桶分配 variant, 实时查看曝光/点击/转化率
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "取消" : "新建实验"}
        </button>
      </div>

      {/* 创建表单 */}
      {showCreate && (
        <section className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800/50 dark:bg-primary-950/20">
          <h2 className="text-sm font-semibold">新实验</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] text-neutral-500">Key (唯一标识) *</label>
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="homepage-cta-2026"
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">名称 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="首页 CTA 文案"
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-neutral-500">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="测试新 CTA 文案对点击率的影响"
                rows={2}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-neutral-500">Variants</label>
              <div className="mt-1 space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
                    <input
                      value={v.id}
                      onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, id: e.target.value } : x))}
                      placeholder="id"
                      className="w-16 rounded border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <input
                      value={v.name}
                      onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      placeholder="名称"
                      className="flex-1 rounded border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <input
                      value={v.value ?? ""}
                      onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                      placeholder="value (可选)"
                      className="flex-1 rounded border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <input
                      type="number"
                      value={v.weight}
                      onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, weight: Number(e.target.value) } : x))}
                      className="w-16 rounded border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <span className="text-[10px] text-neutral-500">%</span>
                    <button
                      onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}
                      className="grid h-6 w-6 place-items-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setVariants((vs) => [...vs, { id: String.fromCharCode(97 + vs.length), name: `Variant ${String.fromCharCode(65 + vs.length)}`, weight: 50 }])}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:border-primary-300 hover:text-primary-700"
                >
                  <Plus className="h-3 w-3" /> 添加 variant
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => create("draft")}
              disabled={busy || !key.trim() || !name.trim()}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              {busy ? <Loader2 className="inline h-3 w-3 animate-spin" /> : null} 保存为草稿
            </button>
            <button
              onClick={() => create("running")}
              disabled={busy || !key.trim() || !name.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play className="h-3 w-3" /> 立即运行
            </button>
          </div>
        </section>
      )}

      {/* 实验列表 */}
      {!data || data.experiments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          还没有实验, 点击右上'新建实验'开始
        </div>
      ) : (
        <ul className="space-y-4">
          {data.experiments.map((exp) => {
            const variants = JSON.parse(exp.variants);
            const stat = data.stats[exp.id];
            const statusMeta = STATUS_META[exp.status] ?? STATUS_META.draft;
            return (
              <li key={exp.id} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", statusMeta.color)}>
                        {statusMeta.label}
                      </span>
                      <h2 className="text-base font-semibold">{exp.name}</h2>
                      <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {exp.key}
                      </code>
                    </div>
                    {exp.description && <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{exp.description}</p>}
                    <div className="mt-1 text-[10px] text-neutral-500">
                      创建者: {exp.createdBy.displayName ?? exp.createdBy.email}
                      {exp.startedAt && <span> · 开始 {new Date(exp.startedAt).toLocaleDateString("zh-CN")}</span>}
                      <span> · {exp._count.events} 事件</span>
                    </div>
                  </div>
                </div>

                {/* variant 统计 */}
                {stat && (
                  <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <table className="w-full text-xs">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-medium text-neutral-600 dark:text-neutral-400">Variant</th>
                          <th className="px-3 py-1.5 text-right font-medium text-neutral-600 dark:text-neutral-400">曝光</th>
                          <th className="px-3 py-1.5 text-right font-medium text-neutral-600 dark:text-neutral-400">点击</th>
                          <th className="px-3 py-1.5 text-right font-medium text-neutral-600 dark:text-neutral-400">转化</th>
                          <th className="px-3 py-1.5 text-right font-medium text-neutral-600 dark:text-neutral-400">CTR</th>
                          <th className="px-3 py-1.5 text-right font-medium text-neutral-600 dark:text-neutral-400">CVR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v: Variant) => {
                          const vs: VariantStat = stat.variants[v.id] ?? { name: v.name, impression: 0, click: 0, conversion: 0, ctr: "0.00", cvr: "0.00" };
                          return (
                            <tr key={v.id} className="border-t border-neutral-200 dark:border-neutral-700">
                              <td className="px-3 py-1.5">
                                <span className="font-medium">{vs.name}</span>
                                <span className="ml-2 text-[10px] text-neutral-400">({v.id} · {v.weight}%)</span>
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{vs.impression}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{vs.click}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{vs.conversion}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{vs.ctr}%</td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{vs.cvr}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
