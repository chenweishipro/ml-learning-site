"use client";
import { useState } from "react";
import Link from "next/link";
import { Users, UserPlus, UserCheck, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCard {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  sharedCourses: number;
  sharedCoursesSlugs: string[];
  myRate: number;
  theirRate: number;
  badgesCount: number;
  follower: boolean;
}

export function PeopleList({ users, myId }: { users: UserCard[]; myId: string }) {
  const [list, setList] = useState(users);

  async function toggle(id: string) {
    const u = list.find((x) => x.id === id);
    if (!u) return;
    const method = u.follower ? "DELETE" : "POST";
    const r = await fetch(`/api/follow/${id}`, { method });
    if (r.ok) {
      setList(list.map((x) => (x.id === id ? { ...x, follower: !x.follower } : x)));
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/me/" className="mb-3 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300">
        <ArrowLeft className="h-3.5 w-3.5" /> 回到我的
      </Link>
      <div className="mb-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 dark:bg-primary-950/30 dark:text-primary-300 dark:ring-primary-800/50">
          <Users className="h-3 w-3" />
          学习圈
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">学伴推荐</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          基于你已学完的课程, 找到 {list.length} 位学习路径相近的同学
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500 dark:border-neutral-700">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-neutral-400" />
          <p>学完任意章节后, 我们会推荐学习路径相近的同学</p>
          <Link href="/courses/" className="mt-4 inline-flex rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm text-primary-700 hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300">
            去学一门课
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((u) => {
            const name = u.displayName;
            const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
            const initial = name[0]?.toUpperCase() ?? "?";
            return (
              <div key={u.id} className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start gap-3">
                  <Link href={`/u/${u.id}/`} className="flex-shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={name} className="h-12 w-12 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700" />
                    ) : (
                      <div
                        className="grid h-12 w-12 place-items-center rounded-full text-lg font-bold text-white ring-2 ring-neutral-200 dark:ring-neutral-700"
                        style={{ background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},70%,45%))` }}
                      >
                        {initial}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${u.id}/`} className="text-sm font-semibold hover:text-primary-700 dark:hover:text-primary-300">
                      {name}
                    </Link>
                    {u.bio && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{u.bio}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-primary-50 px-1.5 py-0.5 font-medium text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                        共同 {u.sharedCourses} 门课
                      </span>
                      {u.badgesCount > 0 && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                          {u.badgesCount} 徽章
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[10px] text-neutral-500">
                    共同课程: {u.sharedCoursesSlugs.slice(0, 2).map((s) => s.split("-")[1] ?? s).join(" / ")}
                    {u.sharedCoursesSlugs.length > 2 && " …"}
                  </div>
                  {u.id !== myId && (
                    <button
                      onClick={() => toggle(u.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
                        u.follower
                          ? "border border-neutral-200 bg-white text-neutral-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                          : "border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300"
                      )}
                    >
                      {u.follower ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                      {u.follower ? "已关注" : "关注"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
