// 全文搜索 API
import { fulltextSearch, highlightSnippet } from "@/lib/fulltext-search";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const level = url.searchParams.get("level") ?? "all";

  if (!q.trim()) return ok({ hits: [], total: 0, query: "" });

  try {
    const result = await fulltextSearch({ query: q, limit: Math.min(limit, 50), level });
    // 给 snippet 加高亮
    const hits = result.hits.map((h) => ({
      ...h,
      snippet: highlightSnippet(h.snippet, q),
    }));
    return ok({ hits, total: result.total, query: q });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "搜索失败", 500);
  }
}
