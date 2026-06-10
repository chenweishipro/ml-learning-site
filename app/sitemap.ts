import type { MetadataRoute } from "next";
import { getAllCoursesWithOverrides } from "@/lib/content-overrides";

// 动态生成 sitemap.xml — 包含所有课程与章节
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://122.51.221.63";
  const courses = await getAllCoursesWithOverrides().catch(() => []);

  const lastMod = (d?: Date | string) => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    return new Date(d);
  };

  const items: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  for (const c of courses) {
    items.push({
      url: `${baseUrl}/courses/${c.slug}`,
      lastModified: lastMod(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    });
    for (const ch of c.chapters ?? []) {
      items.push({
        url: `${baseUrl}/courses/${c.slug}/${ch.slug}/`,
        lastModified: lastMod(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  }

  return items;
}
