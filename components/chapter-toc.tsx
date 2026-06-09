"use client";

import { useEffect, useState } from "react";
import { List, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/toc";

interface ChapterTocProps {
  items: TocItem[];
  /** 标题, 默认 "本页目录" */
  label?: string;
}

export function ChapterToc({ items, label = "本页目录" }: ChapterTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    // 找到所有 H2/H3 元素 (rehype-slug 已自动加 id)
    const headings = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找出最靠近顶部的可见 heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px", // 离顶 80px 开始算 active
        threshold: 0,
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    // 平滑滚动, 减去 sticky header 高度
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-neutral-200 bg-white/80 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <span className="inline-flex items-center gap-1.5">
            <List className="h-3.5 w-3.5" />
            {label}
          </span>
          <ChevronUp
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              collapsed && "-rotate-180"
            )}
          />
        </button>

        {!collapsed && (
          <ul className="space-y-1.5 border-l border-neutral-200 text-sm dark:border-neutral-800">
            {items.map((it) => (
              <li
                key={it.id}
                className={cn(
                  "-ml-px border-l-2 transition-colors",
                  it.level === 3 && "pl-6",
                  it.level === 2 && "pl-3",
                  activeId === it.id
                    ? "border-primary-500"
                    : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-700"
                )}
              >
                <a
                  href={`#${it.id}`}
                  onClick={(e) => handleClick(e, it.id)}
                  className={cn(
                    "block py-1 text-xs leading-relaxed transition-colors",
                    activeId === it.id
                      ? "font-medium text-primary-700 dark:text-primary-300"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  )}
                >
                  {it.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
