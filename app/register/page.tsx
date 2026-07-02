import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "注册 · ML 学习站" };

export default function RegisterPage() {
  return (
    <div className="container max-w-md py-16">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300">
        <ArrowLeft className="h-3.5 w-3.5" />
        返回首页
      </Link>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">创建账号</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">几秒钟开始你的 ML 学习之旅</p>
      <Suspense fallback={<div className="text-center text-sm text-neutral-500">加载中...</div>}>
        <RegisterForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        已有账号?{" "}
        <Link href="/login/" className="text-primary-700 hover:underline dark:text-primary-300">
          登录
        </Link>
      </p>
    </div>
  );
}
