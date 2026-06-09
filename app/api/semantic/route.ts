// AI 语义搜索
import { semanticSearch, highlightSemanticSnippet } from "@/lib/semantic-search";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);
  const level = url.searchParams.get("level") ?? "all";

  if (!q.trim()) return ok({ hits: [], total: 0, query: "", provider: "" });

  try {
    const result = await semanticSearch({ query: q, limit, level });
    const hits = result.hits.map((h) => ({
      ...h,
      snippet: highlightSemanticSnippet(h.snippet, q),
    }));
    return ok({ hits, total: result.total, query: q, provider: result.provider });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "搜索失败", 500);
  }
}
