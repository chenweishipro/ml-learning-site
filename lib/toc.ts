// 从 MDX 源提取 H2/H3 标题, 生成 VitePress 风格的目录
import { remark } from "remark";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * 解析 MDX 源, 提取 H2/H3 标题
 * - 复用 rehype-slug 用的同一个 github-slugger 算法, 保证 id 一致
 * - 跳过在代码块里的标题
 * - 跳过空标题
 */
export async function extractToc(mdx: string): Promise<TocItem[]> {
  if (!mdx || !mdx.trim()) return [];

  // MDX 含 JSX 时, 默认 remark 会报错. 我们用宽松模式: 解析时遇到 JSX 跳过即可
  // 用 try-catch, 若失败就返回空目录 (不影响主功能)
  let tree: any;
  try {
    // 注: 不引入 remark-gfm, 因为 v4+ 是 ESM-only, 跟我们 CJS 兼容性不好
    // 我们只要 H2/H3, 普通 markdown 解析器就够
    tree = remark().parse(mdx);
  } catch {
    return [];
  }

  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  visit(tree, (node: any) => {
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      // 提取纯文本
      const text = (node.children || [])
        .filter((c: any) => c.type === "text" || c.type === "inlineCode")
        .map((c: any) => c.value)
        .join("")
        .trim();

      if (!text) return;

      let id = slugger.slug(text);
      // acorn JSX 解析器不允许 id 以数字开头: 加 's-' 前缀
      if (/^[0-9]/.test(id)) {
        id = 's-' + id;
      }
      items.push({
        id,
        text,
        level: node.depth as 2 | 3,
      });
    }
  });

  return items;
}
