// 动态生成 Open Graph 分享图 (1200×630)
// 用 next/og 内置的 ImageResponse, 无外部依赖
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ML 学习站 — 中文机器学习教程";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = {
  primary: "#0ea5e9",
  accent: "#8b5cf6",
  bg: "#0f172a",
  bgSoft: "#1e293b",
  text: "#f1f5f9",
  textSoft: "#94a3b8",
};

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bgSoft} 100%)`,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 装饰圆 */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.primary}40 0%, transparent 70%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.accent}40 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 800,
              color: "white",
            }}
          >
            ML
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: COLORS.text,
                letterSpacing: -2,
              }}
            >
              ML 学习站
            </div>
            <div
              style={{
                fontSize: 24,
                color: COLORS.textSoft,
                marginTop: 8,
              }}
            >
              中文机器学习教程
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginTop: 24,
            color: COLORS.textSoft,
            fontSize: 22,
          }}
        >
          <span>🎓 5 门课程</span>
          <span>·</span>
          <span>📚 23 章节</span>
          <span>·</span>
          <span>🧠 AI 答疑</span>
          <span>·</span>
          <span>📜 证书</span>
        </div>
      </div>
    ),
    { ...size }
  );
}