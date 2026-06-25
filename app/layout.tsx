import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ProgressProvider } from "@/components/progress-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AuthModal } from "@/components/auth-modal";
import { PWARegister } from "@/components/pwa-register";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { InstallPrompt } from "@/components/install-prompt";
import { MobileDetector } from "@/components/mobile-detector";
import { I18nProvider } from "@/lib/i18n";
import { getAllCourses } from "@/lib/content";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://122.51.221.63"),
  title: {
    default: "ML 学习站 · 中文机器学习教程",
    template: "%s · ML 学习站",
  },
  description:
    "面向中文读者的机器学习学习平台: 从 NumPy、Pandas 到线性回归与深度学习, 系统化、可运行、渐进式。",
  keywords: ["机器学习", "深度学习", "Python", "NumPy", "Pandas", "中文教程"],
  authors: [{ name: "ML 学习站" }],
  manifest: "/manifest.json",
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/api/feed/chapters", title: "ML 学习站 · 章节更新" }] } },
  appleWebApp: {
    capable: true,
    title: "ML 学习",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "ML 学习站 · 中文机器学习教程",
    description: "系统化、可运行、渐进式的中文机器学习教程。",
    siteName: "ML 学习站",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ML 学习站 — 中文机器学习教程",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ML 学习站 · 中文机器学习教程",
    description: "系统化、可运行、渐进式的中文机器学习教程。",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  userScalable: true,
};

// 避免首屏闪烁: 在 <head> 注入同步脚本, 提前设置 dark class
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('ml-site-theme');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* iOS PWA 启动画面 (多尺寸适配) */}
        <link rel="apple-touch-startup-image" href="/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <MobileDetector />
        <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <ProgressProvider
              courses={getAllCourses().map((c) => ({
                slug: c.slug,
                chapterSlugs: c.chapters.map((ch) => ch.slug),
              }))}
            >
              <Header />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
              >
                跳到正文
              </a>
              <main id="main-content" className="flex-1">{children}</main>
              <Footer />
              <AuthModal />
            </ProgressProvider>
          </AuthProvider>
        </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
