// 章节专属 Open Graph 分享图 (1200×630)
// 标题 + 课程 + 章节 + 描述
import { ImageResponse } from "next/og";
import { getCourseWithOverrides } from "@/lib/content-overrides";
import { getChapterWithOverrides } from "@/lib/content-overrides";
import { courses as baseCourses } from "@/content/courses/_index";

export const runtime = "nodejs";
export const alt = "ML 学习站 — 章节";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = {
  primary: "#0ea5e9",
  accent: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  bg: "#0f172a",
  bgSoft: "#1e293b",
  text: "#f1f5f9",
  textSoft: "#94a3b8",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: COLORS.emerald,
  intermediate: COLORS.primary,
  advanced: COLORS.amber,
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

export default async function ChapterOGImage({
  params,
}: {
  params: { slug: string; chapter: string };
}) {
  const [course, data] = await Promise.all([
    getCourseWithOverrides(params.slug),
    getChapterWithOverrides(params.slug, params.chapter),
  ]);
  if (!course || !data) {
    return new ImageResponse(
      (
        <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, color: COLORS.text, fontSize: 48 }}>
          章节未找到
        </div>
      ),
      { ...size }
    );
  }

  const level = (course as any).level as string | undefined;
  const levelColor = (level && LEVEL_COLOR[level]) || COLORS.primary;
  const levelLabel = (level && LEVEL_LABEL[level]) || "课程";
  const duration = data.meta.duration ?? "";

  // 截断 description
  const desc = (data.meta.description ?? "").slice(0, 80);
  const courseTitle = course.title;
  const chapterTitle = data.meta.title;
  const courseSlug = course.slug;
  const idx = course.chapters.findIndex((c: any) => c.slug === params.chapter) + 1;
  const total = course.chapters.length;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bgSoft} 100%)`,
          padding: "60px 70px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: COLORS.text,
        }}
      >
        {/* 顶部: 品牌 + 等级 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 800,
                color: "white",
              }}
            >
              ML
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.01em" }}>
              ML 学习站
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 999,
              background: `${levelColor}22`,
              border: `2px solid ${levelColor}`,
              color: levelColor,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {levelLabel}
          </div>
        </div>

        {/* 课程面包屑 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: COLORS.textSoft, marginBottom: 20 }}>
          <span>{courseTitle}</span>
          <span style={{ opacity: 0.5 }}>›</span>
          <span>第 {idx} / {total} 章</span>
        </div>

        {/* 章节标题 (H1) */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            color: COLORS.text,
            marginBottom: 24,
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          {chapterTitle}
        </div>

        {/* 描述 */}
        {desc && (
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: COLORS.textSoft,
              marginBottom: 32,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            {desc}
          </div>
        )}

        {/* 底部: 时长 + URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 22, color: COLORS.textSoft }}>
            {duration && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>⏱</span>
                <span>{duration}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>📚</span>
              <span>{courseSlug}</span>
            </div>
          </div>
          <div style={{ fontSize: 22, color: COLORS.textSoft, fontFamily: "monospace" }}>
            ml.chenweishi.cn
          </div>
        </div>

        {/* 装饰: 底部彩条 */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, display: "flex" }}>
          <div style={{ flex: 1, background: COLORS.primary }} />
          <div style={{ flex: 1, background: COLORS.accent }} />
          <div style={{ flex: 1, background: COLORS.emerald }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
