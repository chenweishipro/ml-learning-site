// /chapters.xml — RSS 2.0 订阅 (章节更新)
// 数据源: ChapterOverride.updatedAt + 章节 mtime
import { prisma } from "@/lib/db";
import { getAllCoursesSync } from "@/lib/content-overrides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://122.51.221.63:7892";
  const allCourses = getAllCoursesSync();

  // 拿所有 override 更新
  const overrides = await prisma.chapterOverride.findMany({
    where: {},
    select: { courseSlug: true, chapterSlug: true, updatedAt: true, body: true },
  });
  const overrideMap = new Map<string, { updatedAt: Date; snippet: string }>();
  for (const o of overrides) {
    const text = o.body.replace(/```[\s\S]*?```/g, "").replace(/<[^>]+>/g, "");
    overrideMap.set(`${o.courseSlug}/${o.chapterSlug}`, {
      updatedAt: o.updatedAt,
      snippet: text.slice(0, 200).trim(),
    });
  }

  type Item = { slug: string; chapter: { slug: string; title: string; description?: string }; pubDate: Date; snippet: string };
  const items: Item[] = [];
  for (const course of allCourses) {
    for (const ch of course.chapters) {
      const ov = overrideMap.get(`${course.slug}/${ch.slug}`);
      // mtime 文件系统 (也许没读到), 用 base course order
      items.push({
        slug: course.slug,
        chapter: { slug: ch.slug, title: ch.title, description: ch.description },
        pubDate: ov?.updatedAt ?? new Date(0),
        snippet: ov?.snippet ?? ch.description ?? "",
      });
    }
  }
  // 按时间倒序, 最多 50
  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  const top = items.slice(0, 50);

  const lastBuild = top[0]?.pubDate ?? new Date();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ML 学习站 · 章节更新</title>
    <link>${baseUrl}/</link>
    <description>面向中文读者的机器学习学习平台, 11 门课程 44 章节, 持续更新。</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/chapters.xml" rel="self" type="application/rss+xml" />
    ${top
      .map(
        (it) => `<item>
    <title>${escapeXml(it.chapter.title)}</title>
    <link>${baseUrl}/courses/${it.slug}/${it.chapter.slug}/</link>
    <guid isPermaLink="true">${baseUrl}/courses/${it.slug}/${it.chapter.slug}/</guid>
    <description>${escapeXml(it.snippet)}</description>
    <pubDate>${it.pubDate.toUTCString()}</pubDate>
    <category>${escapeXml(it.slug)}</category>
  </item>`
      )
      .join("\n    ")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
