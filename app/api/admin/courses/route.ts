// 管理员: 列出所有课程 (带 override 状态)
import { requireAdmin } from "@/lib/admin";
import { getAllCoursesSync } from "@/lib/content-overrides";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);

  const bases = getAllCoursesSync();
  const overrides = await prisma.courseOverride.findMany({
    select: { courseSlug: true, title: true, description: true, level: true, duration: true, tags: true, updatedAt: true },
  });
  const overrideMap = new Map<string, { courseSlug: string; title: string | null; description: string | null; level: string | null; duration: string | null; tags: string | null; updatedAt: Date }>(overrides.map((o) => [o.courseSlug, o]));

  const items = bases.map((c) => {
    const ov = overrideMap.get(c.slug);
    return {
      slug: c.slug,
      title: ov?.title ?? c.title,
      description: ov?.description ?? c.description,
      level: ov?.level ?? c.level,
      duration: ov?.duration ?? c.duration,
      tags: ov?.tags ? safeParseTags(ov.tags) : (c.tags ?? []),
      chapterCount: c.chapters.length,
      hasOverride: !!ov,
      overrideUpdatedAt: ov?.updatedAt ?? null,
    };
  });

  return ok({ items });
}

function safeParseTags(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
