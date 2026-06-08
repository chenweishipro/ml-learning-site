import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  hoverable?: boolean;
}

/** 基础卡片容器: 圆角、柔阴影、可选悬浮效果 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, hoverable = false, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg bg-white ring-1 ring-neutral-200/80 shadow-soft",
        "dark:bg-neutral-900 dark:ring-neutral-800/80",
        hoverable && "card-hover cursor-pointer",
        className
      )}
      {...rest}
    />
  );
});

export function CardHeader({
  className,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-6 pb-3", className)} {...rest} />;
}

export function CardTitle({
  className,
  ...rest
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn("text-lg font-semibold text-neutral-900 dark:text-neutral-50", className)}
      {...rest}
    />
  );
}

export function CardDescription({
  className,
  ...rest
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn("mt-1.5 text-sm text-neutral-600 leading-relaxed dark:text-neutral-400", className)}
      {...rest}
    />
  );
}

export function CardContent({
  className,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...rest} />;
}

export function CardFooter({
  className,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 pt-0 text-sm",
        className
      )}
      {...rest}
    />
  );
}
