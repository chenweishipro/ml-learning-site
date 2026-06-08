import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "neutral" | "amber";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-50 text-primary-700 ring-primary-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-200",
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
};

export interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
