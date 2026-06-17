/** 章节下载 (MD / Text / HTML)
 * GET /api/chapter/export?slug=...&chapter=...&format=md|text|html
 * 不需登录 (章节内容是公开的)
 */
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["md", "text", "html"]);

function stripFrontmatter(mdx: string): { frontmatter: Record<string, string>; body: string } {
  const m = mdx.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: {}, body: mdx };
  const fm: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, "");
  }
  return { frontmatter: fm, body: m[2] };
}

function stripMdx(md: string): string {
  return md
    // 去掉 import 行
    .replace(/^import .+$/gm, "")
    // <Component /> 简化为名称
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/?>(?:<\/\\1>)?/g, "($1)")
    // <Component prop="x" /> 不管 prop
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*?\/>/g, "($1)")
    // 去掉 HTML 注释
    .replace(/<!--[\s\S]*?-->/g, "")
    // $$ ... $$ 块
    .replace(/\\\$\$[\s\S]*?\\\$\$/g, "[数学公式]")
    // $ ... $ 行内
    .replace(/\\\$(?:[^\\\$]|\\\$[^\\\$])*\\\$/g, "[公式]")
    // 简化 <Math ...> 和 <MBlock ...>
    .replace(/<(?:Math|MBlock|M)\b[^>]*?\/>/g, "[数学]")
    .replace(/<(?:Math|MBlock|M)\b[^>]*>[\s\S]*?<\/(?:Math|MBlock|M)>/g, "[数学]")
    .trim();
}

function mdToText(md: string): string {
  return md
    // 代码块
    .replace(/```[a-z]*\n([\s\S]*?)```/g, (_, code) => `\n${code}\n`)
    // 行内代码
    .replace(/`([^`]+)`/g, "$1")
    // 链接 [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    // 图片 ![alt](url) -> [图片: alt]
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "[图片: $1]")
    // 标题
    .replace(/^#{1,6}\s+(.+)$/gm, (_, t) => `\n${t}\n${"=".repeat(Math.min(t.length, 30))}`)
    // 引用
    .replace(/^>\s*(.*)$/gm, "  | $1")
    // 粗体/斜体
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // 列表
    .replace(/^[-*]\s+/gm, "  - ")
    .replace(/^\d+\.\s+/gm, "  ")
    // 多余空行
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mdToHtml(md: string, title: string): string {
  // 极简 markdown → HTML, 不依赖外部库
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listOpen = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(`<pre><code>${escape(codeBuf.join("\n"))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        if (listOpen) { out.push("</ul>"); listOpen = false; }
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (line.startsWith("# ")) { if (listOpen) { out.push("</ul>"); listOpen = false; } out.push(`<h1>${escape(line.slice(2))}</h1>`); continue; }
    if (line.startsWith("## ")) { if (listOpen) { out.push("</ul>"); listOpen = false; } out.push(`<h2>${escape(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("### ")) { if (listOpen) { out.push("</ul>"); listOpen = false; } out.push(`<h3>${escape(line.slice(4))}</h3>`); continue; }
    if (line.startsWith("> ")) { if (listOpen) { out.push("</ul>"); listOpen = false; } out.push(`<blockquote>${escape(line.slice(2))}</blockquote>`); continue; }
    if (line.match(/^[-*]\s+/)) {
      if (!listOpen) { out.push("<ul>"); listOpen = true; }
      out.push(`<li>${escape(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      if (listOpen) { out.push("</ul>"); listOpen = false; }
      out.push("");
      continue;
    }
    if (listOpen) { out.push("</ul>"); listOpen = false; }
    // 行内: 粗体 + 链接
    let html = escape(line);
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    out.push(`<p>${html}</p>`);
  }
  if (listOpen) out.push("</ul>");
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${escape(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body { max-width: 720px; margin: 40px auto; padding: 0 16px; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.7; color: #1a1a1a; }
  h1, h2, h3 { line-height: 1.3; }
  h1 { font-size: 1.6rem; margin: 1.5em 0 0.5em; }
  h2 { font-size: 1.3rem; margin: 1.3em 0 0.4em; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.3em; }
  h3 { font-size: 1.1rem; margin: 1.2em 0 0.3em; }
  p { margin: 0.8em 0; }
  code { background: #f4f4f4; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
  pre code { background: transparent; padding: 0; }
  blockquote { border-left: 3px solid #ddd; padding-left: 12px; color: #666; margin: 1em 0; }
  ul { padding-left: 1.5em; }
  a { color: #0ea5e9; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 2em 0; }
  footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #e5e5e5; font-size: 0.8em; color: #888; }
</style>
</head>
<body>
${out.join("\n")}
<footer>由 ML 学习站导出 · 仅供学习使用</footer>
</body>
</html>`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const chapter = url.searchParams.get("chapter");
  const format = (url.searchParams.get("format") ?? "md").toLowerCase();
  if (!slug || !chapter) return NextResponse.json({ error: "缺少 slug/chapter" }, { status: 400 });
  if (!ALLOWED.has(format)) return NextResponse.json({ error: "format 必须是 md/text/html" }, { status: 400 });

  const file = path.join(process.cwd(), "content", "courses", slug, `${chapter}.mdx`);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    return NextResponse.json({ error: "章节不存在" }, { status: 404 });
  }
  const { frontmatter, body } = stripFrontmatter(raw);
  const cleaned = stripMdx(body);
  const title = frontmatter.title ?? chapter;

  if (format === "md") {
    const header = `<!-- ${title} · 由 ML 学习站导出 (${new Date().toLocaleDateString("zh-CN")}) -->\n\n# ${title}\n\n`;
    return new Response(header + cleaned, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}_${chapter}.md"`,
      },
    });
  }
  if (format === "text") {
    const text = `${title}\n${"=".repeat(Math.min(title.length * 2, 40))}\n\n` + mdToText(cleaned);
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}_${chapter}.txt"`,
      },
    });
  }
  // html
  const html = mdToHtml(cleaned, title);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}_${chapter}.html"`,
    },
  });
}
