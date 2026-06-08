// 管理员: 预览 MDX (不存库, 临时序列化)
import { requireAdmin } from "@/lib/admin";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { fail, ok, readJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const body = await readJson<{ source?: string }>(req);
  if (!body || typeof body.source !== "string") {
    return fail("source 字段必须是字符串", 400);
  }
  if (body.source.length > 500_000) {
    return fail("内容超过 500KB", 413);
  }

  try {
    const mdxSource = await serialize(body.source, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["anchor"] } }],
        ],
      },
      parseFrontmatter: false,
    });
    return ok({ mdxSource });
  } catch (err) {
    return fail(
      "MDX 解析失败: " + (err instanceof Error ? err.message : String(err)),
      400
    );
  }
}
