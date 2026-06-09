"use client";

import {
  ArrowUp,
  ArrowDown,
  Crown,
  Edit3,
  Loader2,
  Mail,
  MoreVertical,
  Trash2,
  User as UserIcon,
  RotateCcw,
  Activity,
  BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/components/auth-provider";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
  _count: { contentEdits: number };
  completedChapters: number;
}

const ROLE_META: Record<
  Role,
  {
    label: string;
    classes: string;
    cardRing: string;
    icon: typeof UserIcon;
    description: string;
  }
> = {
  user: {
    label: "普通用户",
    classes: "bg-neutral-50 text-neutral-600 ring-neutral-200 dark:bg-neutral-800/50 dark:text-neutral-300 dark:ring-neutral-700",
    cardRing: "ring-neutral-200 dark:ring-neutral-800",
    icon: UserIcon,
    description: "学习者",
  },
  admin: {
    label: "管理员",
    classes: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
    cardRing: "ring-amber-200 dark:ring-amber-800/50",
    icon: Edit3,
    description: "内容编辑",
  },
  superadmin: {
    label: "超级管理员",
    classes: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
    cardRing: "ring-rose-200 dark:ring-rose-800/50",
    icon: Crown,
    description: "全部权限",
  },
};

const ROLE_ORDER: Role[] = ["user", "admin", "superadmin"];

function activityLevel(c: { contentEdits: number; completedChapters: number }) {
  const score = c.contentEdits * 5 + c.completedChapters;
  if (score === 0) return { label: "沉睡", dots: 0, color: "bg-neutral-300 dark:bg-neutral-700" };
  if (score < 5) return { label: "低", dots: 1, color: "bg-blue-400 dark:bg-blue-500" };
  if (score < 20) return { label: "中", dots: 2, color: "bg-emerald-400 dark:bg-emerald-500" };
  if (score < 50) return { label: "活跃", dots: 3, color: "bg-amber-400 dark:bg-amber-500" };
  return { label: "狂热", dots: 4, color: "bg-rose-400 dark:bg-rose-500" };
}

interface UserCardProps {
  user: AdminUser;
  isSelf: boolean;
  isCurrentSuperAdmin: boolean;
  busy?: boolean;
  onView: () => void;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
}

export function UserCard({
  user,
  isSelf,
  isCurrentSuperAdmin,
  busy,
  onView,
  onPromote,
  onDemote,
  onDelete,
  onResetPassword,
}: UserCardProps) {
  const meta = ROLE_META[user.role];
  const Icon = meta.icon;
  const act = activityLevel({ contentEdits: user._count.contentEdits, completedChapters: user.completedChapters });

  // 升降级方向: 找相邻角色
  const idx = ROLE_ORDER.indexOf(user.role);
  const canPromote = !isSelf && isCurrentSuperAdmin && idx < ROLE_ORDER.length - 1;
  const canDemote = !isSelf && isCurrentSuperAdmin && idx > 0;
  // 至少保留 1 个 superadmin 的边界判断需要 server 端做, 这里先 enable
  // (后端 PATCH 会拒绝, 错误信息会显示)

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700",
        "ring-1",
        meta.cardRing
      )}
    >
      {/* 顶部: 头像 + 角色 */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-base font-semibold text-white">
            {(user.displayName?.[0] ?? user.email[0] ?? "U").toUpperCase()}
          </div>
          <span
            className={cn(
              "absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-white dark:ring-neutral-900",
              user.role === "superadmin" && "bg-rose-500",
              user.role === "admin" && "bg-amber-500",
              user.role === "user" && "bg-neutral-400"
            )}
            title={meta.label}
          >
            <Icon className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {user.displayName ?? user.email.split("@")[0]}
            </h3>
            {isSelf && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800/50">
                你
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
            meta.classes
          )}
        >
          {meta.label}
        </span>
      </div>

      {/* 数据条 */}
      <div className="grid grid-cols-2 gap-2 border-y border-neutral-100 py-2.5 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          <BookOpenCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-50">
            {user.completedChapters}
          </span>
          <span>章完成</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          <Edit3 className="h-3.5 w-3.5 text-amber-500" />
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-50">
            {user._count.contentEdits}
          </span>
          <span>次编辑</span>
        </div>
      </div>

      {/* 活跃度 + 注册时间 */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i < act.dots ? act.color : "bg-neutral-200 dark:bg-neutral-800"
                )}
              />
            ))}
          </div>
          <span>{act.label}</span>
        </div>
        <span>注册 {new Date(user.createdAt).toLocaleDateString("zh-CN")}</span>
      </div>

      {/* 操作栏 */}
      <div className="-mx-4 -mb-4 flex items-center justify-between gap-1 border-t border-neutral-100 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900/30">
        <button
          onClick={onView}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-600 transition hover:bg-white hover:text-primary-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-primary-300"
        >
          详情
        </button>
        <div className="flex items-center gap-1">
          {canPromote && (
            <button
              onClick={onPromote}
              disabled={busy}
              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              title={`提升为 ${ROLE_META[ROLE_ORDER[idx + 1]].label}`}
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUp className="h-3 w-3" />}
              提升
            </button>
          )}
          {canDemote && (
            <button
              onClick={onDemote}
              disabled={busy}
              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-amber-700 transition hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
              title={`降为 ${ROLE_META[ROLE_ORDER[idx - 1]].label}`}
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowDown className="h-3 w-3" />}
              降级
            </button>
          )}
          <button
            onClick={onResetPassword}
            disabled={busy}
            className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
            title="触发密码重置邮件"
          >
            <RotateCcw className="h-3 w-3" />
            重置密码
          </button>
          {!isSelf && isCurrentSuperAdmin && (
            <button
              onClick={onDelete}
              disabled={busy}
              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              title="删除用户"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
