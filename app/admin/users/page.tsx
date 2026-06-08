"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Edit3,
  Loader2,
  ShieldAlert,
  Trash2,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useAuth, type Role } from "@/components/auth-provider";

interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
  _count: { contentEdits: number };
  completedChapters: number;
}

const ROLE_META: Record<Role, { label: string; classes: string; icon: typeof UserIcon; desc: string }> = {
  user: {
    label: "普通用户",
    classes: "bg-neutral-50 text-neutral-600 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-300 dark:ring-neutral-700",
    icon: UserIcon,
    desc: "仅可浏览、记录学习进度",
  },
  admin: {
    label: "管理员",
    classes: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
    icon: Edit3,
    desc: "可编辑课程与章节内容",
  },
  superadmin: {
    label: "超级管理员",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
    icon: Crown,
    desc: "全部权限 + 可设管理员",
  },
};

export default function UsersAdminPage() {
  const { user: currentUser, isSuperAdmin, ready } = useAuth();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/admin/users/", { credentials: "include" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setUsers(data.data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    }
  }

  useEffect(() => {
    if (ready && isSuperAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isSuperAdmin]);

  // 等待 ready
  if (!ready) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  // 仅 superadmin 可进
  if (!currentUser || !isSuperAdmin) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-800/40 dark:bg-rose-950/30">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-4 text-lg font-semibold text-rose-900 dark:text-rose-300">
            需要超级管理员权限
          </h1>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">
            用户管理仅对超级管理员开放。当前账号 <code>{currentUser?.email}</code> 权限不足。
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            返回管理首页
          </Link>
        </div>
      </div>
    );
  }

  async function changeRole(u: UserRow, newRole: Role) {
    if (u.role === newRole) return;
    setError(null);
    setSuccess(null);
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "修改失败");
        return;
      }
      setSuccess(`已将 ${u.email} 设为「${ROLE_META[newRole].label}」`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`确定要删除用户 ${u.email} 吗? 此操作不可撤销, 将同时清除其进度和编辑记录。`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "删除失败");
        return;
      }
      setSuccess(`已删除用户 ${u.email}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setBusyId(null);
    }
  }

  if (error && !users) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!users) {
    return (
      <div className="container py-12">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const superAdminCount = users.filter((u) => u.role === "superadmin").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;

  return (
    <div className="container py-10 sm:py-12">
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/admin" className="inline-flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300">
          <ArrowLeft className="h-3.5 w-3.5" />
          管理首页
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-900 dark:text-neutral-50">用户管理</span>
      </div>

      <div className="mb-8">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50">
          👑 超级管理员专属
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">用户与权限</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          管理全站用户角色。提升/降级实时生效, 但有两条保护:
          系统始终保留至少 1 个超级管理员, 且不能改自己的角色。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(["superadmin", "admin", "user"] as const).map((r) => {
          const m = ROLE_META[r];
          const count = r === "superadmin" ? superAdminCount : r === "admin" ? adminCount : userCount;
          const Icon = m.icon;
          return (
            <div
              key={r}
              className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                {count}
              </div>
              <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{m.desc}</div>
            </div>
          );
        })}
      </div>

      {/* 提示信息 */}
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* 用户列表 */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50/50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3">用户</th>
              <th className="px-4 py-3">当前角色</th>
              <th className="hidden px-4 py-3 sm:table-cell">活跃度</th>
              <th className="hidden px-4 py-3 sm:table-cell">注册时间</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const meta = ROLE_META[u.role];
              const Icon = meta.icon;
              return (
                <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-white">
                        {(u.displayName?.[0] ?? u.email[0] ?? "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-50">
                          <span className="truncate">{u.displayName ?? u.email.split("@")[0]}</span>
                          {isSelf && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800/50">
                              你
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.classes}`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-neutral-600 sm:table-cell dark:text-neutral-400">
                    {u.completedChapters} 章完成 · {u._count.contentEdits} 次编辑
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-neutral-500 sm:table-cell dark:text-neutral-400">
                    {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={u.role}
                        disabled={isSelf || busyId === u.id}
                        onChange={(e) => changeRole(u, e.target.value as Role)}
                        className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
                        title={isSelf ? "不能修改自己的角色" : "切换角色"}
                      >
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                        <option value="superadmin">超级管理员</option>
                      </select>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={isSelf || busyId === u.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-950/30"
                        title={isSelf ? "不能删除自己" : "删除用户"}
                      >
                        {busyId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          暂无用户
        </div>
      )}

      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        共 {users.length} 个用户
        {superAdminCount > 0 && ` · 其中 ${superAdminCount} 个超级管理员`}
      </p>
    </div>
  );
}
