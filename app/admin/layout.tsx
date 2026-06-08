"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isSuperAdmin, ready } = useAuth();
  const router = useRouter();
  const [showCheck, setShowCheck] = useState(false);

  // 等 auth ready 之后才决定展示什么 — 避免闪烁
  useEffect(() => {
    if (!ready) return;
    setShowCheck(true);
  }, [ready]);

  if (!showCheck) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            需要登录
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            请先登录账号, 然后回到此页面。
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/40 dark:bg-red-950/30">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-300">
            无管理员权限
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            当前账号 <code>{user.email}</code> 没有管理后台访问权限。
            <br />
            如需授权, 请联系站点所有者。
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
