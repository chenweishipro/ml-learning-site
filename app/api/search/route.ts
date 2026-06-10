// 全文搜索 API (FTS5 + 缓存)
import { fulltextSearch, ensureFtsIndex } from "@/lib/fulltext-search";
import { fail, ok } from "@/lib/api";
import { cached } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const level = url.searchParams.get("level") ?? "all";
  const cacheKey = `search:${level}:${limit}:${q.trim()}`;

  if (!q.trim()) return ok({ hits: [], total: 0, query: "" });

  try {
    // 首次访问时构建 FTS 索引 (缓存 30 分钟自动失效, 重建)
    await ensureFtsIndex();
    const result = await cached(
      cacheKey,
      () => fulltextSearch({ query: q, limit, level }),
      3 * 60 * 1000
    );
    return ok({ ...result, cached: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "搜索失败", 500);
  }
}
