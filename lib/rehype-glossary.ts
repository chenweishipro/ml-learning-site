// rehype plugin: 在 MDX 渲染时自动包裹匹配 glossary term 的文本
import { visit } from "unist-util-visit";
import { GLOSSARY } from "./glossary";
import type { Plugin } from "unified";
import type { Root, Text, Element, ElementContent } from "hast";

const TERMS = Array.from(
  new Set(
    GLOSSARY.flatMap((e) => [e.term, ...(e.aliases ?? [])])
  )
).sort((a, b) => b.length - a.length);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const PATTERN = new RegExp(`(${TERMS.map(escapeRegExp).join("|")})`, "g");

function transformElement(el: Element): void {
  const newChildren: ElementContent[] = [];
  for (const child of el.children) {
    if (child.type === "text" && typeof (child as Text).value === "string") {
      const txt = (child as Text).value;
      PATTERN.lastIndex = 0;
      if (!PATTERN.test(txt)) {
        newChildren.push(child);
        continue;
      }
      PATTERN.lastIndex = 0;
      const parts = txt.split(PATTERN);
      for (const part of parts) {
        if (!part) continue;
        const matched = TERMS.find((t) => t === part);
        if (matched) {
          newChildren.push({
            type: "raw",
            value: `<span class="glossary-term" data-term="${matched}">${part}</span>`,
          } as unknown as ElementContent);
        } else {
          newChildren.push({ type: "text", value: part });
        }
      }
    } else if (child.type === "element") {
      transformElement(child);
      newChildren.push(child);
    } else {
      newChildren.push(child);
    }
  }
  el.children = newChildren;
}

export function rehypeGlossary(): Plugin<[void], Root> {
  return () => (tree: Root) => {
    visit(tree, "element", (el) => transformElement(el));
  };
}
