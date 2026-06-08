import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** 0 - 100 */
  value: number;
  /** 是否显示百分比文字 */
  showLabel?: boolean;
  className?: string;
  /** 颜色变体 */
  variant?: "primary" | "accent";
}

export function ProgressBar({
  value,
  showLabel = true,
  className,
  variant = "primary",
}: ProgressBarProps) {
  const safe = Math.max(0, Math.min(100, value));
  const fillClass =
    variant === "accent"
      ? "bg-gradient-to-r from-accent-500 to-accent-400"
      : "bg-gradient-to-r from-primary-600 to-primary-500";

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-600">
          <span className="font-medium">学习进度</span>
          <span className="tabular-nums">{Math.round(safe)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-200/80"
        role="progressbar"
        aria-valuenow={Math.round(safe)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", fillClass)}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
