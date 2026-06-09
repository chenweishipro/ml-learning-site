"use client";

import { useEffect, useState } from "react";
import {
  X,
  Crown,
  Edit3,
  User as UserIcon,
  Mail,
  Calendar,
  Trash2,
  Edit,
  BookOpenCheck,
  Save,
  Loader2,
  CheckCircle2,
  Copy,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/components/auth-provider";
import { PermissionMatrix } from "./PermissionMatrix";
import { ConfirmDialog } from "./ConfirmDialog";
import type { AdminUser } from "./UserCard";

interface UserDetailModalProps {
  user: AdminUser;
  currentUserId: string;
  isCurrentSuperAdmin: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  onUserDeleted: () => void;
}

const ROLE_META: Record<
  Role,
  { label: string; classes: string; icon: typeof UserIcon; description: string }
> = {
  user: {
    label: "普通用户",
    classes: "bg-neutral-50 text-neutral-700 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-200 dark:ring-neutral-700",
    icon: UserIcon,
    description: "学习者: 可浏览全部内容、记录学习进度、使用 Python 沙盒",
  },
  admin: {
    label: "管理员",
    classes: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
    icon: Edit3,
    description: "内容编辑: 拥有普通用户所有权限, 加上编辑课程/章节内容、查看修订历史、删除内容覆盖",
  },
  superadmin: {
    label: "超级管理员",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
    icon: Crown,
    description: "全部权限: 拥有管理员所有权限, 加上管理用户角色、删除用户、触发密码重置",
  },
};

const ROLE_ORDER: Role[] = ["user", "admin", "superadmin"];

export function UserDetailModal({
  user,
  currentUserId,
  isCurrentSuperAdmin,
  onClose,
  onUserUpdated,
  onUserDeleted,
}: UserDetailModalProps) {
  const isSelf = user.id === currentUserId;
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetInfo, setResetInfo] = useState<{
    url: string;
    expiresAt: string;
    emailSent: boolean;
    emailError: string | null;
    expiresInMinutes: number;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedRole(user.role);
    setError(null);
    setSuccess(null);
    setResetInfo(null);
  }, [user.id, user.role]);

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !deleting && !resetting) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, saving, deleting, resetting]);

  async function handleSave() {
    if (selectedRole === user.role) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "修改失败");
        return;
      }
      setSuccess(`已将 ${user.email} 设为「${ROLE_META[selectedRole].label}」`);
      onUserUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "删除失败");
        return;
      }
      setShowDeleteConfirm(false);
      onUserDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetPassword() {
    setResetting(true);
    setError(null);
    setResetInfo(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "触发重置失败");
        return;
      }
      setResetInfo(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setResetting(false);
    }
  }

  function copyResetUrl() {
    if (!resetInfo) return;
    navigator.clipboard.writeText(resetInfo.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start gap-4 border-b border-neutral-200 bg-gradient-to-br from-primary-50/40 via-white to-white px-6 py-5 dark:border-neutral-800 dark:from-primary-950/20 dark:via-neutral-900 dark:to-neutral-900">
          <div className="relative flex-shrink-0">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-primary text-xl font-semibold text-white">
              {(user.displayName?.[0] ?? user.email[0] ?? "U").toUpperCase()}
            </div>
            <span
              className={cn(
                "absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-white dark:ring-neutral-900",
                user.role === "superadmin" && "bg-rose-500",
                user.role === "admin" && "bg-amber-500",
                user.role === "user" && "bg-neutral-400"
              )}
            >
              {(() => {
                const Icon = ROLE_META[user.role].icon;
                return <Icon className="h-3 w-3 text-white" strokeWidth={3} />;
              })()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {user.displayName ?? user.email.split("@")[0]}
              </h2>
              {isSelf && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800/50">
                  你
                </span>
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                  ROLE_META[user.role].classes
                )}
              >
                {ROLE_META[user.role].label}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                注册 {new Date(user.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 主体: 两列 */}
        <div className="max-h-[calc(90vh-180px)] grid gap-5 overflow-y-auto p-6 md:grid-cols-2">
          {/* 左列: 数据 + 角色调整 */}
          <div className="space-y-4">
            {/* 活跃度卡片 */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                活跃度
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={BookOpenCheck}
                  label="完成章节"
                  value={user.completedChapters}
                  color="emerald"
                />
                <StatCard
                  icon={Edit}
                  label="内容编辑"
                  value={user._count.contentEdits}
                  color="amber"
                />
              </div>
            </div>

            {/* 角色调整 */}
            {isCurrentSuperAdmin && !isSelf && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  调整角色
                </h3>
                <div className="space-y-2">
                  {ROLE_ORDER.map((r) => {
                    const m = ROLE_META[r];
                    const Icon = m.icon;
                    const selected = selectedRole === r;
                    return (
                      <label
                        key={r}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition",
                          selected
                            ? "border-primary-400 bg-primary-50/60 dark:border-primary-700 dark:bg-primary-950/30"
                            : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
                        )}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r}
                          checked={selected}
                          onChange={() => setSelectedRole(r)}
                          className="mt-0.5 h-4 w-4 accent-primary-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-300" />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              {m.label}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                            {m.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {error && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {success}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || selectedRole === user.role}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    保存角色
                  </button>
                  {selectedRole !== user.role && (
                    <button
                      onClick={() => setSelectedRole(user.role)}
                      disabled={saving}
                      className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      取消
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 自己的角色提示 */}
            {isSelf && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>不能修改自己的角色。如需调整, 请联系其他超级管理员。</span>
                </div>
              </div>
            )}

            {/* 触发密码重置 */}
            {isCurrentSuperAdmin && !isSelf && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  密码重置
                </h3>
                <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
                  生成一次性的重置链接, 自动发送到该用户的邮箱 (如果 SMTP 已配置)。
                </p>
                <button
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
                >
                  {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  触发密码重置
                </button>

                {resetInfo && (
                  <div className="mt-3 rounded-md border border-blue-200 bg-blue-50/40 p-3 text-xs dark:border-blue-800/40 dark:bg-blue-950/20">
                    {resetInfo.emailSent ? (
                      <div className="mb-2 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        邮件已发送到 {user.email}
                      </div>
                    ) : (
                      <div className="mb-2 inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        邮件未发送 ({resetInfo.emailError ?? "SMTP 未配置"})
                        <span className="text-neutral-500 dark:text-neutral-400">· 可手动复制下方链接分享</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <code className="block min-w-0 flex-1 truncate rounded border border-blue-200 bg-white px-2 py-1 font-mono text-[11px] text-blue-800 dark:border-blue-800/40 dark:bg-neutral-900 dark:text-blue-200">
                        {resetInfo.url}
                      </code>
                      <button
                        onClick={copyResetUrl}
                        className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-800/40 dark:bg-neutral-900 dark:text-blue-300 dark:hover:bg-blue-950/30"
                      >
                        {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "已复制" : "复制"}
                      </button>
                      <a
                        href={resetInfo.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-800/40 dark:bg-neutral-900 dark:text-blue-300 dark:hover:bg-blue-950/30"
                        title="在新标签页打开"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="mt-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                      链接 {resetInfo.expiresInMinutes} 分钟内有效, 仅可使用一次
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 删除用户 */}
            {isCurrentSuperAdmin && !isSelf && (
              <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-4 dark:border-rose-800/40 dark:bg-rose-950/20">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-rose-700 dark:text-rose-400">
                  危险操作
                </h3>
                <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
                  删除用户将清空其进度、编辑日志和修订历史, 且不可恢复。
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800/50 dark:bg-neutral-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除此用户
                </button>
              </div>
            )}
          </div>

          {/* 右列: 权限矩阵(高亮当前角色) */}
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {ROLE_META[user.role].label} 可执行的操作
            </h3>
            <PermissionMatrix highlightRole={user.role} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除此用户?"
        description={
          <div className="space-y-1.5">
            <p>
              将删除用户 <strong>{user.email}</strong> 及其所有数据 (学习进度、编辑日志、修订历史)。
            </p>
            <p className="text-rose-700 dark:text-rose-400">此操作不可撤销。</p>
          </div>
        }
        confirmLabel="确认删除"
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Edit;
  label: string;
  value: number;
  color: "emerald" | "amber" | "blue" | "rose";
}) {
  const COLOR_MAP: Record<typeof color, string> = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/50",
    amber: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/50",
    blue: "bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/50",
    rose: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/50",
  };
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className={cn("grid h-5 w-5 place-items-center rounded ring-1", COLOR_MAP[color])}>
          <Icon className="h-3 w-3" />
        </span>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
        {value}
      </div>
    </div>
  );
}

