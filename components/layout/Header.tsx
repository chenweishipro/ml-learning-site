"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useState } from "react";
import { Menu, X, GraduationCap } from "lucide-react";
import { Nav } from "./Nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { UserMenu } from "@/components/user-menu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, ready, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white dark:bg-neutral-900/85 backdrop-blur supports-[backdrop-filter]:bg-white dark:bg-neutral-900/65 dark:border-neutral-800/80 dark:bg-neutral-950/85 dark:supports-[backdrop-filter]:bg-neutral-950/65">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold text-neutral-900 dark:text-neutral-50"
        >
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-white shadow-soft transition group-hover:shadow-glow">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-base sm:text-lg">
            ML <span className="text-primary-600 dark:text-primary-400">学习站</span>
          </span>
        </Link>

        <div className="hidden md:block">
          <Nav />
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/search"
            className="rounded-md border border-neutral-200 bg-white dark:bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-600 transition hover:border-primary-300 hover:text-primary-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:border-primary-700 dark:hover:text-primary-300"
          >
            🔍 搜索
          </Link>
          <Link
            href="/chat"
            className="rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800/50 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
          >
            🤖 问 AI
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <NotificationCenter mode="bell" />
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
            >
              🛠 管理
            </Link>
          )}
          {ready && user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("login")}
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
              >
                登录
              </button>
              <Link
                href="/courses"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-primary-700"
              >
                开始学习
              </Link>
            </div>
          )}
        </div>

        {/* 移动端汉堡菜单 */}
        <div className="flex items-center gap-1 md:hidden">
            <NotificationCenter mode="bell" />
          <LocaleSwitcher />
          <ThemeToggle />
          <button
            type="button"
            aria-label="切换菜单"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-md text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-neutral-200/80 bg-white dark:border-neutral-800/80 dark:bg-neutral-950">
          <div className="container py-3">
            <Nav vertical onNavigate={() => setOpen(false)} />
            <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="block w-full rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                🔍 搜索
              </Link>
              {ready && user ? (
                <MobileUserBlock onClose={() => setOpen(false)} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      openAuthModal("login");
                    }}
                    className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      openAuthModal("register");
                    }}
                    className="rounded-md border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300"
                  >
                    注册
                  </button>
                </div>
              )}
              <Link
                href="/courses"
                onClick={() => setOpen(false)}
                className="block w-full rounded-md bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-700"
              >
                开始学习
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileUserBlock({ onClose }: { onClose: () => void }) {
  const { user, isAdmin, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
        已登录为 <strong>{user.displayName ?? user.email}</strong>
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onClose}
            className="mt-2 block w-full rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300"
          >
            🛠 管理后台
          </Link>
        )}
      </div>
      <button
        onClick={async () => {
          onClose();
          await logout();
        }}
        className="block w-full rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        退出登录
      </button>
    </div>
  );
}
