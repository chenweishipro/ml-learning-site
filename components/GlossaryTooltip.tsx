"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { lookupGlossary, GLOSSARY_CATEGORIES, GLOSSARY } from "@/lib/glossary";
const TERMS = Array.from(new Set(GLOSSARY.flatMap((e) => [e.term, ...(e.aliases ?? [])]))).sort((a, b) => b.length - a.length);
import { cn } from "@/lib/utils";

export function GlossaryTooltip() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });


  useEffect(() => {
    let cancelled = false;
    // 1) 术语 hover 监听
    const onEnter = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.classList?.contains("glossary-term")) {
        const k = t.getAttribute("data-term");
        if (k) {
          setTerm(k);
          const me = e as MouseEvent;
          setPos({ x: me.clientX, y: me.clientY });
          setOpen(true);
        }
      }
    };
    const onMove = (e: MouseEvent) => {
      if (open) setPos({ x: e.clientX, y: e.clientY });
    };
    const onLeave = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.classList?.contains("glossary-term")) {
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mouseover", onEnter, true);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseout", onLeave, true);
    document.addEventListener("scroll", onScroll, true);
    // 2) 自动 scan 章节 main 区域, 给匹配的 term 包 span
    const scanTerms = () => {
      if (cancelled) return;
      const targets = document.querySelectorAll(".prose, [data-glossary-scope]");
      targets.forEach((root) => {
        if (root.querySelector(".glossary-term")) return; // 已 scan
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => {
            const p = n.parentElement;
            if (!p) return NodeFilter.FILTER_REJECT;
            const tag = p.tagName;
            if (tag === "CODE" || tag === "PRE" || tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        });
        const matches: Array<{ node: Text; terms: Array<[string, string]> }> = [];
        let tn: Node | null = walker.nextNode();
        while (tn) {
          const txt = (tn as any).value || "";
          if (txt.length > 2) {
            const found: Array<[string, string]> = [];
            for (const t of TERMS) {
              if (txt.includes(t)) found.push([t, t]);
            }
            if (found.length > 0) matches.push({ node: tn as Text, terms: found });
          }
          tn = walker.nextNode();
        }
        for (const m of matches) {
          const txt = (m.node as any).value || "";
          const PATTERN_LOCAL = new RegExp(`(${m.terms.map((x) => x[0]).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
          const parts = txt.split(PATTERN_LOCAL);
          const frag = document.createDocumentFragment();
          for (const part of parts) {
            if (!part) continue;
            const matched = m.terms.find(([t]) => t === part);
            if (matched) {
              const span = document.createElement("span");
              span.className = "glossary-term";
              span.setAttribute("data-term", matched[0]);
              span.textContent = part;
              frag.appendChild(span);
            } else {
              frag.appendChild(document.createTextNode(part));
            }
          }
          m.node.parentNode?.replaceChild(frag, m.node);
        }
      });
    };
    const TIMEOUTS = [300, 1000, 2500];
    TIMEOUTS.forEach((t) => setTimeout(scanTerms, t));
    cancelled = true;
    return () => {
      document.removeEventListener("mouseover", onEnter, true);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseout", onLeave, true);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const entry = term ? lookupGlossary(term) : null;

  return (
    <>
      <style jsx global>{`
        .glossary-term {
          border-bottom: 1px dashed currentColor;
          cursor: help;
          color: #0ea5e9;
        }
        .glossary-term:hover {
          color: #0284c7;
        }
      `}</style>
      {open && entry && (
        <div
          className="pointer-events-none fixed z-50 max-w-sm rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
          style={{
            top: Math.min(pos.y + 14, window.innerHeight - 200),
            left: Math.min(Math.max(pos.x - 180, 8), window.innerWidth - 360),
          }}
        >
          <div className="mb-1 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary-600" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">{entry.term}</span>
            <span className={cn(
              "ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium",
              "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            )}>
              {GLOSSARY_CATEGORIES[entry.category]}
            </span>
          </div>
          <p className="text-xs text-neutral-700 dark:text-neutral-300">{entry.short}</p>
          {entry.relatedChapters && entry.relatedChapters.length > 0 && (
            <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">相关章节</div>
              <ul className="mt-0.5 space-y-0.5">
                {entry.relatedChapters.map((c) => (
                  <li key={`${c.courseSlug}/${c.chapterSlug}`}>
                    <a
                      href={`/courses/${c.courseSlug}/${c.chapterSlug}/`}
                      className="text-[11px] text-primary-700 hover:underline dark:text-primary-300"
                    >
                      → {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
