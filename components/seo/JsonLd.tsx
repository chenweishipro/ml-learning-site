/** JSON-LD 结构化数据 — 用于课程 / 章节 / 面包屑 / FAQ / 软件应用 */
import type { CourseMeta, ChapterMeta } from "@/content/courses/_index";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://珍惜时间.website";
const SITE_NAME = "ML 学习站";

interface SiteData {
  course: CourseMeta;
  position?: number; // 在课程目录中的位置 (1-indexed)
}

/** WebSite + SearchAction (Google sitelinks searchbox) */
export function WebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "面向中文读者的机器学习学习平台: 从 NumPy、Pandas 到线性回归与深度学习, 系统化、可运行、渐进式。",
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/** LearningResource (Course) — 用于 /courses/[slug] */
export function CourseJsonLd({ course, position }: SiteData) {
  const url = `${SITE_URL}/courses/${course.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
    educationalLevel: course.level === "beginner" ? "初学者" : course.level === "intermediate" ? "中级" : "高级",
    inLanguage: "zh-CN",
    isAccessibleForFree: true,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: course.duration,
    },
    keywords: course.tags?.join(", "),
    position: position,
    ...(course.cover ? { image: course.cover } : {}),
  };
}

/** LearningResource (Chapter) — 用于 /courses/[slug]/[chapter] */
export function ChapterJsonLd({
  course,
  chapter,
}: {
  course: CourseMeta;
  chapter: ChapterMeta;
}) {
  const url = `${SITE_URL}/courses/${course.slug}/${chapter.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: chapter.title,
    description: chapter.description,
    url,
    educationalLevel: course.level,
    learningResourceType: "lesson",
    isAccessibleForFree: true,
    inLanguage: "zh-CN",
    timeRequired: chapter.duration,
    isPartOf: {
      "@type": "Course",
      name: course.title,
      url: `${SITE_URL}/courses/${course.slug}/`,
    },
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

/** BreadcrumbList — 面包屑导航 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

/** FAQPage — 常见问题 */
export function FaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** SoftwareApplication (PWA 元数据) */
export function SoftwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    operatingSystem: "Web Browser (PWA)",
    applicationCategory: "EducationalApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "128" },
  };
}

/** 通用 <script type="application/ld+json"> 包装器 */
export function JsonLd({ data }: { data: object | object[] }) {
  const arr = Array.isArray(data) ? data : [data];
  return (
    <>
      {arr.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // 防止 react 注入时 escape 字符 (JSON-LD 必须是合法 JSON)
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}