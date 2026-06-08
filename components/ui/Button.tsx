import Link from "next/link";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft",
  secondary:
    "bg-white text-neutral-900 ring-1 ring-neutral-200 hover:bg-neutral-50 hover:ring-neutral-300 dark:bg-neutral-800 dark:text-neutral-50 dark:ring-neutral-700 dark:hover:bg-neutral-700 dark:hover:ring-neutral-600",
  outline:
    "bg-transparent text-primary-700 ring-1 ring-primary-300 hover:bg-primary-50 dark:text-primary-300 dark:ring-primary-700 dark:hover:bg-primary-950/30",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-md",
  md: "h-11 px-5 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-lg",
};

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  href?: string;
}

/**
 * 通用按钮组件。
 *  - 当传 `href` 时渲染为 Next.js Link, 保持 SPA 导航体验
 *  - 否则渲染为原生 <button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", href, children, ...rest },
    ref
  ) {
    const classes = cn(
      "inline-flex items-center justify-center font-medium transition-all",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
      "focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900",
      "disabled:opacity-50 disabled:pointer-events-none",
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...rest}>
        {children}
      </button>
    );
  }
);
