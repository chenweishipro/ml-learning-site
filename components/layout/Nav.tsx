"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export interface NavItem {
  label: string;
  href: string;
}

function useNavItems(): NavItem[] {
  const { t } = useI18n();
  return [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.courses"), href: "/courses" },
    { label: t("nav.qa"), href: "/qa" },
    { label: t("nav.ai"), href: "/chat" },
    { label: t("nav.about"), href: "/about" },
    { label: "🧠 知识图谱", href: "/knowledge-graph" },
  ];
}

export interface NavProps {
  /** 是否为移动端折叠菜单样式 */
  vertical?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function Nav({ vertical = false, onNavigate, className }: NavProps) {
  const pathname = usePathname();
  const items = useNavItems();

  return (
    <nav
      className={cn(
        vertical ? "flex flex-col gap-1" : "flex items-center gap-1",
        className
      )}
    >
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              vertical && "block"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
