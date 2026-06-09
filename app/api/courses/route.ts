// 返回轻量课程列表 (用于客户端组件, 避免引入 fs)
import { getAllCoursesSync } from "@/lib/content-overrides";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const courses = getAllCoursesSync() as any[];
  return ok({
    courses: courses.map((c) => ({
      slug: c.slug,
      title: c.title,
      chapters: (c.chapters ?? []).map((ch: any) => ({ slug: ch.slug, title: ch.title })),
    })),
  });
}
