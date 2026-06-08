"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth-provider";

const STORAGE_KEY = "ml-site-progress-v1";
const SYNC_DEBOUNCE_MS = 800;

/** 单个章节的学习状态 */
export interface ChapterProgress {
  visited: boolean;      // 是否打开过
  completed: boolean;    // 是否标记完成
  visitedAt?: string;    // 最后访问时间
  completedAt?: string;  // 完成时间
}

interface ProgressMap {
  [courseSlug: string]: {
    [chapterSlug: string]: ChapterProgress;
  };
}

interface CourseTotal {
  slug: string;
  chapterSlugs: string[];
}

interface ProgressContextValue {
  /** 获取某章节的进度状态 */
  getChapter: (course: string, chapter: string) => ChapterProgress;
  /** 标记某章节为已访问(在章节页挂载时调用) */
  markVisited: (course: string, chapter: string) => void;
  /** 切换完成状态 */
  toggleCompleted: (course: string, chapter: string) => void;
  /** 单门课程的进度 0-100 */
  getCoursePercent: (course: string) => number;
  /** 全站总进度 0-100 */
  getOverallPercent: () => number;
  /** 单门课程已完成的章节数 */
  getCompletedCount: (course: string) => number;
  /** 清空所有进度 */
  reset: () => void;
  /** 是否已挂载 (用于避免 SSR mismatch) */
  ready: boolean;
  /** 当前课程总章节数 (来自 Provider 的 props) */
  getCourseTotal: (course: string) => number;
  /** 是否正在与服务端同步 */
  syncing: boolean;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

function readFromStorage(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as ProgressMap;
  } catch {
    return {};
  }
}

function writeToStorage(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** 把后端返回的扁平记录还原为嵌套 map */
function fromServer(records: Array<{ courseSlug: string; chapterSlug: string; completed: boolean; updatedAt: string | Date }>): ProgressMap {
  const map: ProgressMap = {};
  for (const r of records) {
    if (!r.completed) continue;
    if (!map[r.courseSlug]) map[r.courseSlug] = {};
    map[r.courseSlug][r.chapterSlug] = {
      visited: true,
      completed: true,
      visitedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt.toISOString(),
      completedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt.toISOString(),
    };
  }
  return map;
}

/** 收集所有 completed=true 的章节, 用于推送到后端 */
function toServerPayload(map: ProgressMap) {
  const items: Array<{ courseSlug: string; chapterSlug: string; completed: boolean }> = [];
  for (const [courseSlug, chapters] of Object.entries(map)) {
    for (const [chapterSlug, p] of Object.entries(chapters)) {
      if (p.completed) items.push({ courseSlug, chapterSlug, completed: true });
    }
  }
  return items;
}

export function ProgressProvider({ children, courses }: { children: React.ReactNode; courses: CourseTotal[] }) {
  const { user, ready: authReady } = useAuth();
  const [map, setMap] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初次挂载从 localStorage 读取
  useEffect(() => {
    setMap(readFromStorage());
    setReady(true);
  }, []);

  // 同步到 localStorage
  useEffect(() => {
    if (ready) writeToStorage(map);
  }, [map, ready]);

  // 登录后:从服务端拉取并合并
  useEffect(() => {
    if (!authReady || !ready) return;
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/progress", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.ok) return;
        const serverMap = fromServer(data.data.progress ?? []);
        // 合并:服务端 ∪ 本地 (都取 completed=true)
        setMap((prev) => {
          const next: ProgressMap = { ...prev };
          for (const [course, chapters] of Object.entries(serverMap)) {
            next[course] = { ...(next[course] ?? {}), ...chapters };
          }
          return next;
        });
      } catch {
        // ignore network errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authReady, ready]);

  // 完成状态变更后:登录用户防抖同步到服务端
  useEffect(() => {
    if (!ready || !user) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      setSyncing(true);
      try {
        const items = toServerPayload(map);
        if (items.length === 0) return;
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          credentials: "include",
        });
      } catch {
        // ignore
      } finally {
        setSyncing(false);
      }
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [map, ready, user]);

  const getChapter = useCallback(
    (course: string, chapter: string): ChapterProgress => {
      return map[course]?.[chapter] ?? { visited: false, completed: false };
    },
    [map]
  );

  const markVisited = useCallback((course: string, chapter: string) => {
    setMap((prev) => {
      const courseProgress = prev[course] ?? {};
      const existing = courseProgress[chapter] ?? { visited: false, completed: false };
      if (existing.visited) return prev;
      return {
        ...prev,
        [course]: {
          ...courseProgress,
          [chapter]: {
            ...existing,
            visited: true,
            visitedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const toggleCompleted = useCallback((course: string, chapter: string) => {
    setMap((prev) => {
      const courseProgress = prev[course] ?? {};
      const existing = courseProgress[chapter] ?? { visited: false, completed: false };
      const willComplete = !existing.completed;
      return {
        ...prev,
        [course]: {
          ...courseProgress,
          [chapter]: {
            ...existing,
            visited: true,
            visitedAt: existing.visitedAt ?? new Date().toISOString(),
            completed: willComplete,
            completedAt: willComplete ? new Date().toISOString() : undefined,
          },
        },
      };
    });
  }, []);

  const getCourseTotal = useCallback(
    (course: string) => {
      return courses.find((c) => c.slug === course)?.chapterSlugs.length ?? 0;
    },
    [courses]
  );

  const getCompletedCount = useCallback(
    (course: string) => {
      const courseProgress = map[course];
      if (!courseProgress) return 0;
      return Object.values(courseProgress).filter((c) => c.completed).length;
    },
    [map]
  );

  const getCoursePercent = useCallback(
    (course: string) => {
      const total = getCourseTotal(course);
      if (total === 0) return 0;
      return Math.round((getCompletedCount(course) / total) * 100);
    },
    [getCourseTotal, getCompletedCount]
  );

  const getOverallPercent = useCallback(() => {
    const totalChapters = courses.reduce((s, c) => s + c.chapterSlugs.length, 0);
    if (totalChapters === 0) return 0;
    const completed = courses.reduce((s, c) => s + getCompletedCount(c.slug), 0);
    return Math.round((completed / totalChapters) * 100);
  }, [courses, getCompletedCount]);

  const reset = useCallback(() => {
    setMap({});
  }, []);

  const value: ProgressContextValue = {
    getChapter,
    markVisited,
    toggleCompleted,
    getCoursePercent,
    getOverallPercent,
    getCompletedCount,
    getCourseTotal,
    reset,
    ready,
    syncing,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    return {
      getChapter: () => ({ visited: false, completed: false }),
      markVisited: () => {},
      toggleCompleted: () => {},
      getCoursePercent: () => 0,
      getOverallPercent: () => 0,
      getCompletedCount: () => 0,
      getCourseTotal: () => 0,
      reset: () => {},
      ready: false,
      syncing: false,
    } as ProgressContextValue;
  }
  return ctx;
}
