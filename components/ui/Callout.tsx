import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CalloutType = "info" | "tip" | "warning" | "danger";

const styleMap: Record<
  CalloutType,
  { wrapper: string; icon: string; title: string; Icon: LucideIcon; defaultTitle: string }
> = {
  info: {
    wrapper: "bg-primary-50/80 ring-primary-200 text-primary-950",
    icon: "text-primary-600",
    title: "text-primary-800",
    Icon: Info,
    defaultTitle: "提示",
  },
  tip: {
    wrapper: "bg-accent-50/80 ring-accent-200 text-accent-950",
    icon: "text-accent-600",
    title: "text-accent-800",
    Icon: Lightbulb,
    defaultTitle: "小贴士",
  },
  warning: {
    wrapper: "bg-amber-50/90 ring-amber-200 text-amber-950",
    icon: "text-amber-600",
    title: "text-amber-800",
    Icon: AlertTriangle,
    defaultTitle: "注意",
  },
  danger: {
    wrapper: "bg-rose-50/90 ring-rose-200 text-rose-950",
    icon: "text-rose-600",
    title: "text-rose-800",
    Icon: AlertTriangle,
    defaultTitle: "危险",
  },
};

export interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * 语义化的提示卡片: info / tip / warning / danger 四种风格。
 * 在 MDX 中可以直接使用: `<Callout type="tip">...</Callout>`
 */
export function Callout({
  type = "info",
  title,
  children,
  className,
}: CalloutProps) {
  const { wrapper, icon, title: titleClass, Icon, defaultTitle } = styleMap[type];
  return (
    <aside
      className={cn(
        "my-6 flex gap-3 rounded-lg p-4 ring-1",
        wrapper,
        className
      )}
      role="note"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", icon)} aria-hidden />
      <div className="flex-1 text-sm leading-relaxed">
        <p className={cn("mb-1 font-semibold", titleClass)}>
          {title ?? defaultTitle}
        </p>
        <div className="text-neutral-700">{children}</div>
      </div>
    </aside>
  );
}
