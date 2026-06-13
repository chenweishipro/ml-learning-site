"use client";
import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FollowButton({ userId }: { userId: string }) {
  const [state, setState] = useState<"unknown" | "following" | "not">("unknown");
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (state === "following") {
        await fetch(`/api/follow/${userId}`, { method: "DELETE" });
        setState("not");
      } else {
        const r = await fetch(`/api/follow/${userId}`, { method: "POST" });
        if (r.ok) setState("following");
        else if (r.status === 401) {
          window.location.href = "/login/";
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (state === "unknown") {
    return (
      <button
        onClick={async () => {
          const r = await fetch(`/api/follow/${userId}`);
          if (r.status === 401) { window.location.href = "/login/"; return; }
          const d = await r.json();
          setState(d.following ? "following" : "not");
        }}
        className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        加载中...
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50",
        state === "following"
          ? "border border-neutral-200 bg-white text-neutral-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-rose-800/50 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
          : "border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-950/50"
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : state === "following" ? (
        <UserCheck className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {state === "following" ? "已关注" : "关注"}
    </button>
  );
}
