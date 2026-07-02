import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "登录 · ML 学习站" };

export default function LoginPage() {
  return (
    <div className="container max-w-md py-16">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300">
        <ArrowLeft className="h-3.5 w-3.5" />
        返回首页
      </Link>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">欢迎回来</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">登录后继续学习旅程</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        还没有账号?{" "}
        <Link href="/register/" className="text-primary-700 hover:underline dark:text-primary-300">
          立即注册
        </Link>
      </p>
    </div>
  );
}
