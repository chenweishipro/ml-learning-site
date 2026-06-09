"use client";

import { Check, Minus, User as UserIcon, Edit3, Crown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/components/auth-provider";

interface Permission {
  key: string;
  label: string;
  description: string;
  roles: Role[];
}

const PERMISSIONS: Permission[] = [
  {
    key: "browse",
    label: "浏览课程与章节",
    description: "查看所有公开内容、搜索、阅读章节",
    roles: ["user", "admin", "superadmin"],
  },
  {
    key: "progress",
    label: "记录学习进度",
    description: "标记章节已完成、查看个人进度",
    roles: ["user", "admin", "superadmin"],
  },
  {
    key: "playground",
    label: "使用 Python 沙盒",
    description: "在浏览器中运行 Python 代码",
    roles: ["user", "admin", "superadmin"],
  },
  {
    key: "edit_content",
    label: "编辑课程/章节内容",
    description: "在 /admin 编辑课程元数据与章节 MDX 正文",
    roles: ["admin", "superadmin"],
  },
  {
    key: "view_revisions",
    label: "查看修订历史与回滚",
    description: "查看内容快照、一键回滚到任意历史版本",
    roles: ["admin", "superadmin"],
  },
  {
    key: "manage_users",
    label: "管理用户与角色",
    description: "提升/降级用户、删除用户、触发密码重置",
    roles: ["superadmin"],
  },
  {
    key: "delete_content",
    label: "删除内容覆盖",
    description: "重置课程/章节到仓库原始版本",
    roles: ["admin", "superadmin"],
  },
];

const ROLE_ORDER: Role[] = ["user", "admin", "superadmin"];

const ROLE_META: Record<Role, { label: string; classes: string; headerClass: string; icon: typeof UserIcon }> = {
  user: {
    label: "普通用户",
    classes: "text-neutral-600 dark:text-neutral-300",
    headerClass: "bg-neutral-50 text-neutral-700 ring-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-200 dark:ring-neutral-700",
    icon: UserIcon,
  },
  admin: {
    label: "管理员",
    classes: "text-amber-700 dark:text-amber-300",
    headerClass: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50",
    icon: Edit3,
  },
  superadmin: {
    label: "超级管理员",
    classes: "text-rose-700 dark:text-rose-300",
    headerClass: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50",
    icon: Crown,
  },
};

interface PermissionMatrixProps {
  /** 高亮某一行的角色, 用于上下文 (例如详情弹窗里) */
  highlightRole?: Role;
}

export function PermissionMatrix({ highlightRole }: PermissionMatrixProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-950/30 dark:text-primary-400 dark:ring-primary-800/50">
          <Info className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            权限矩阵
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            鼠标悬停查看权限说明 · 绿色对勾表示该角色拥有此权限
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="w-1/2 px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                权限
              </th>
              {ROLE_ORDER.map((r) => {
                const m = ROLE_META[r];
                const Icon = m.icon;
                return (
                  <th
                    key={r}
                    className={cn(
                      "px-3 py-3 text-center",
                      highlightRole === r && "bg-primary-50/40 dark:bg-primary-950/20"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                        m.headerClass
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {m.label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {PERMISSIONS.map((p) => (
              <tr
                key={p.key}
                className="group transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
              >
                <td className="px-5 py-3">
                  <div className="font-medium text-neutral-900 dark:text-neutral-50">{p.label}</div>
                  <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {p.description}
                  </div>
                </td>
                {ROLE_ORDER.map((r) => {
                  const has = p.roles.includes(r);
                  return (
                    <td
                      key={r}
                      className={cn(
                        "px-3 py-3 text-center",
                        highlightRole === r && "bg-primary-50/40 dark:bg-primary-950/20"
                      )}
                    >
                      {has ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/50">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-50 text-neutral-300 ring-1 ring-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-700 dark:ring-neutral-800">
                          <Minus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
