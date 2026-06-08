"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuth } from "./auth-provider";

export function UserMenu() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  const initial = (user.displayName?.[0] ?? user.email[0] ?? "U").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-1 pr-3 text-sm transition hover:border-primary-300 hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="hidden text-neutral-700 sm:inline dark:text-neutral-200">
          {user.displayName ?? user.email.split("@")[0]}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-neutral-500" />
              <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                当前账号
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {user.displayName ?? user.email}
            </p>
            {user.displayName && (
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
            )}
          </div>
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
            disabled={loading}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
