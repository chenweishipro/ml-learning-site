import { clsx, type ClassValue } from "clsx";

/**
 * Tailwind className 合并工具。
 * 封装 clsx 以便日后替换为 twMerge 之类的库，无需修改调用方。
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * 把分钟数格式化为 "X 小时 Y 分钟" 字符串。
 * 输入 < 60 时直接返回 "Y 分钟"。
 */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 分钟";
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
}

/**
 * 难度枚举 -> 中文标签 + Tailwind 颜色 class
 */
export const LEVEL_META: Record<
  "beginner" | "intermediate" | "advanced",
  { label: string; classes: string }
> = {
  beginner: {
    label: "入门",
    classes: "bg-accent-50 text-accent-700 ring-1 ring-accent-200",
  },
  intermediate: {
    label: "进阶",
    classes: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
  },
  advanced: {
    label: "高级",
    classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
};
