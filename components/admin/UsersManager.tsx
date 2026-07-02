"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  Crown,
  Edit3,
  Grid3x3,
  List,
  Loader2,
  Mail,
  Search,
  ShieldAlert,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth, type Role } from "@/components/auth-provider";
import { PermissionMatrix } from "./PermissionMatrix";
import { UserCard, type AdminUser } from "./UserCard";
import { UserDetailModal } from "./UserDetailModal";
import { ConfirmDialog } from "./ConfirmDialog";

const ROLE_META: Record<Role, { label: string; classes: string; icon: typeof UserIcon; description: string }> = {
  user: {
    label: "普通用户",
    classes: "bg-neutral-50 text-neutral-600 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-300 dark:ring-neutral-700",
    icon: UserIcon,
    description: "学习者: 可浏览全部内容、记录学习进度",
  },
  admin: {
    label: "管理员",
    classes: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
    icon: Edit3,
    description: "内容编辑: 编辑课程/章节、查看修订历史",
  },
  superadmin: {
    label: "超级管理员",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
    icon: Crown,
    description: "全部权限 + 管理用户角色",
  },
};

const ROLE_ORDER: Role[] = ["user", "admin", "superadmin"];

type FilterRole = Role | "all";
type SortKey = "newest" | "oldest" | "name" | "edits" | "progress";

export function UsersManager() {
  const { user: currentUser, isSuperAdmin, ready } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // UI 状态
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterRole>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [showMatrix, setShowMatrix] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: AdminUser;
    newRole: Role;
  } | null>(null);

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

  // 过滤 + 搜索 + 排序
  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    let result = users.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.displayName ?? "").toLowerCase().includes(q)
      );
    });
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          return (a.displayName ?? a.email).localeCompare(b.displayName ?? b.email, "zh-CN");
        case "edits":
          return b._count.contentEdits - a._count.contentEdits;
        case "progress":
          return b.completedChapters - a.completedChapters;
      }
    });
    // 置顶自己
    if (currentUser) {
      result = [
        ...result.filter((u) => u.id === currentUser.id),
        ...result.filter((u) => u.id !== currentUser.id),
      ];
    }
    return result;
  }, [users, query, filter, sort, currentUser]);

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
            href="/admin/"
            className="mt-5 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            返回管理首页
          </Link>
        </div>
      </div>
    );
  }

  async function changeRole(u: AdminUser, newRole: Role) {
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

  function getNextRole(role: Role, direction: 1 | -1): Role | null {
    const idx = ROLE_ORDER.indexOf(role);
    const next = idx + direction;
    if (next < 0 || next >= ROLE_ORDER.length) return null;
    return ROLE_ORDER[next];
  }

  function handlePromote(u: AdminUser) {
    const next = getNextRole(u.role, 1);
    if (next) setPendingRoleChange({ user: u, newRole: next });
  }
  function handleDemote(u: AdminUser) {
    const next = getNextRole(u.role, -1);
    if (next) setPendingRoleChange({ user: u, newRole: next });
  }

  async function handleDelete(u: AdminUser) {
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

  async function handleResetPassword(u: AdminUser) {
    if (!confirm(`确定要为 ${u.email} 触发密码重置吗? 系统会生成一次性链接并尝试通过邮件发送。`)) {
      return;
    }
    setBusyId(u.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/reset-password/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "触发失败");
        return;
      }
      if (data.data?.emailSent) {
        setSuccess(`密码重置邮件已发送给 ${u.email}`);
      } else if (data.data?.url) {
        setSuccess(`已生成重置链接(邮件未发送), 请打开详情查看 URL`);
      }
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

  const counts: Record<FilterRole, number> = {
    all: users.length,
    user: users.filter((u) => u.role === "user").length,
    admin: users.filter((u) => u.role === "admin").length,
    superadmin: users.filter((u) => u.role === "superadmin").length,
  };

  return (
    <div className="container py-10 sm:py-12">
      {/* 面包屑 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href="/admin/"
          className="inline-flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          管理首页
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-900 dark:text-neutral-50">用户管理</span>
      </div>

      {/* 标题 */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50">
            👑 超级管理员专属
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">用户与权限</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            管理全站用户角色, 一键提升/降级、删除用户、触发密码重置。
            系统始终保留至少 1 个超级管理员, 且不能改自己的角色。
          </p>
        </div>
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition",
            showMatrix
              ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950/30 dark:text-primary-300"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:text-primary-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          )}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          {showMatrix ? "隐藏" : "查看"}权限矩阵
        </button>
      </div>

      {/* 权限矩阵 (可折叠) */}
      {showMatrix && (
        <div className="mb-6">
          <PermissionMatrix />
        </div>
      )}

      {/* 统计卡片 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(["superadmin", "admin", "user"] as const).map((r) => {
          const m = ROLE_META[r];
          const count = counts[r];
          const Icon = m.icon;
          return (
            <button
              key={r}
              onClick={() => setFilter(filter === r ? "all" : r)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left transition dark:bg-neutral-900",
                filter === r
                  ? "border-primary-400 ring-2 ring-primary-200 dark:border-primary-700 dark:ring-primary-800/50"
                  : "border-neutral-200 hover:border-primary-300 dark:border-neutral-800 dark:hover:border-primary-700"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Icon className="h-3.5 w-3.5" />
                {m.label}
                {filter === r && (
                  <span className="ml-auto inline-flex items-center gap-0.5 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    已筛选
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                {count}
              </div>
              <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                点击 {filter === r ? "清除" : "只看"}该角色
              </div>
            </button>
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

      {/* 工具栏: 搜索 + 角色 Tab + 排序 + 视图切换 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        {/* 搜索框 */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索邮箱或昵称..."
            className="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-8 text-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-900"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="清空搜索"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* 角色 Tab */}
        <div className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
          {(
            [
              { v: "all", label: "全部", count: counts.all },
              { v: "superadmin", label: "超级", count: counts.superadmin },
              { v: "admin", label: "管理员", count: counts.admin },
              { v: "user", label: "普通", count: counts.user },
            ] as { v: FilterRole; label: string; count: number }[]
          ).map((tab) => (
            <button
              key={tab.v}
              onClick={() => setFilter(tab.v)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition",
                filter === tab.v
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded px-1 text-[10px]",
                  filter === tab.v
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 排序 */}
        <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs dark:border-neutral-700">
          <ArrowUpDown className="h-3 w-3 text-neutral-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent text-xs text-neutral-700 focus:outline-none dark:text-neutral-300"
          >
            <option value="newest">最新注册</option>
            <option value="oldest">最早注册</option>
            <option value="name">按名称</option>
            <option value="edits">编辑数</option>
            <option value="progress">完成章节</option>
          </select>
        </div>

        {/* 视图切换 */}
        <div className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
          <button
            onClick={() => setView("cards")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded transition",
              view === "cards"
                ? "bg-primary-600 text-white"
                : "text-neutral-500 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
            )}
            title="卡片视图"
            aria-label="卡片视图"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded transition",
              view === "table"
                ? "bg-primary-600 text-white"
                : "text-neutral-500 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
            )}
            title="表格视图"
            aria-label="表格视图"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          没有匹配的用户
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              isSelf={u.id === currentUser.id}
              isCurrentSuperAdmin={isSuperAdmin}
              busy={busyId === u.id}
              onView={() => setDetailUser(u)}
              onPromote={() => handlePromote(u)}
              onDemote={() => handleDemote(u)}
              onDelete={() => handleDelete(u)}
              onResetPassword={() => handleResetPassword(u)}
            />
          ))}
        </div>
      ) : (
        <UserTable
          users={filtered}
          currentUserId={currentUser.id}
          isSuperAdmin={isSuperAdmin}
          busyId={busyId}
          onView={setDetailUser}
          onPromote={handlePromote}
          onDemote={handleDemote}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
        />
      )}

      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        共 {users.length} 个用户
        {counts.superadmin > 0 && ` · ${counts.superadmin} 个超级管理员`}
        {counts.admin > 0 && ` · ${counts.admin} 个管理员`}
        {counts.user > 0 && ` · ${counts.user} 个普通用户`}
        {(query || filter !== "all") && ` · 当前显示 ${filtered.length} 个`}
      </p>

      {/* 用户详情弹窗 */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          currentUserId={currentUser.id}
          isCurrentSuperAdmin={isSuperAdmin}
          onClose={() => setDetailUser(null)}
          onUserUpdated={() => {
            load();
          }}
          onUserDeleted={() => {
            setDetailUser(null);
            load();
          }}
        />
      )}

      {/* 角色变更确认弹窗 */}
      <ConfirmDialog
        open={!!pendingRoleChange}
        onClose={() => setPendingRoleChange(null)}
        onConfirm={async () => {
          if (!pendingRoleChange) return;
          await changeRole(pendingRoleChange.user, pendingRoleChange.newRole);
          setPendingRoleChange(null);
        }}
        title={`确认${ROLE_ORDER.indexOf(pendingRoleChange?.newRole ?? "user") > ROLE_ORDER.indexOf(pendingRoleChange?.user.role ?? "user") ? "提升" : "降级"}用户角色?`}
        description={
          pendingRoleChange && (
            <div className="space-y-2">
              <p>
                将 <strong>{pendingRoleChange.user.email}</strong> 从
                <span className="mx-1 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 align-middle"
                  style={{
                    background: undefined
                  }}
                >
                  <span className={ROLE_META[pendingRoleChange.user.role].classes + " inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1"}>
                    {ROLE_META[pendingRoleChange.user.role].label}
                  </span>
                </span>
                改为
                <span className="ml-1 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 align-middle">
                  <span className={ROLE_META[pendingRoleChange.newRole].classes + " inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1"}>
                    {ROLE_META[pendingRoleChange.newRole].label}
                  </span>
                </span>
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {ROLE_META[pendingRoleChange.newRole].description}
              </p>
            </div>
          )
        }
        confirmLabel={
          pendingRoleChange
            ? ROLE_ORDER.indexOf(pendingRoleChange.newRole) > ROLE_ORDER.indexOf(pendingRoleChange.user.role)
              ? "确认提升"
              : "确认降级"
            : "确认"
        }
        loading={!!busyId}
        variant="warning"
      />
    </div>
  );
}

function UserTable({
  users,
  currentUserId,
  isSuperAdmin,
  busyId,
  onView,
  onPromote,
  onDemote,
  onDelete,
  onResetPassword,
}: {
  users: AdminUser[];
  currentUserId: string;
  isSuperAdmin: boolean;
  busyId: string | null;
  onView: (u: AdminUser) => void;
  onPromote: (u: AdminUser) => void;
  onDemote: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
  onResetPassword: (u: AdminUser) => void;
}) {
  return (
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
            const isSelf = u.id === currentUserId;
            const meta = ROLE_META[u.role];
            const Icon = meta.icon;
            const idx = ROLE_ORDER.indexOf(u.role);
            const canPromote = !isSelf && isSuperAdmin && idx < ROLE_ORDER.length - 1;
            const canDemote = !isSelf && isSuperAdmin && idx > 0;
            return (
              <tr
                key={u.id}
                className="cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                onClick={() => onView(u)}
              >
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
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                      meta.classes
                    )}
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
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {canPromote && (
                      <button
                        onClick={() => onPromote(u)}
                        disabled={busyId === u.id}
                        className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      >
                        提升
                      </button>
                    )}
                    {canDemote && (
                      <button
                        onClick={() => onDemote(u)}
                        disabled={busyId === u.id}
                        className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[11px] font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                      >
                        降级
                      </button>
                    )}
                    <button
                      onClick={() => onResetPassword(u)}
                      disabled={busyId === u.id}
                      className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    >
                      重置
                    </button>
                    {!isSelf && isSuperAdmin && (
                      <button
                        onClick={() => onDelete(u)}
                        disabled={busyId === u.id}
                        className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[11px] font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
