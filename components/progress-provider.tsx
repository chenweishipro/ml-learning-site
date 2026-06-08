"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ml-site-progress-v1";

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

export function ProgressProvider({ children, courses }: { children: React.ReactNode; courses: CourseTotal[] }) {
  const [map, setMap] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);

  // 初次挂载从 localStorage 读取
  useEffect(() => {
    setMap(readFromStorage());
    setReady(true);
  }, []);

  // 同步到 localStorage
  useEffect(() => {
    if (ready) writeToStorage(map);
  }, [map, ready]);

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
      // 已访问过的不要再更新 visitedAt
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
    } as ProgressContextValue;
  }
  return ctx;
}
