/** @type {import('next').NextConfig} */
const nextConfig = {
  // 不再使用静态导出 — 加了用户认证 API routes
  // 改用 standalone 输出,部署到 Node 服务 (next start)
  output: process.env.STATIC_EXPORT === "1" ? "export" : "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  staticPageGenerationTimeout: 30,
  // 性能加固 (v19.3):
  // 1) compress gzip / br
  compress: true,
  // 2) poweredByHeader 关闭 (安全 + 节省字节)
  poweredByHeader: false,
  // 3) productionBrowserSourceMaps 关闭 (减小构建产物, 但保留 trace)
  productionBrowserSourceMaps: false,
  // 4) optimizePackageImports — 大幅减小图标库 bundle (lucide-react)
  experimental: {
    outputFileTracingExcludes: {
      "*": [".next/cache/**", ".next/server/pages/500.html"],
    },
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "lodash",
      "lodash-es",
      "ramda",
      "ahooks",
      "@ant-design/icons",
      "@headlessui/react",
      "@visx/visx",
      "recharts",
      "react-use",
      "react-icons/ai",
      "react-icons/bi",
      "react-icons/bs",
      "react-icons/cg",
      "react-icons/ci",
      "react-icons/di",
      "react-icons/fa",
      "react-icons/fa6",
      "react-icons/fc",
      "react-icons/fi",
      "react-icons/gi",
      "react-icons/go",
      "react-icons/gr",
      "react-icons/hi",
      "react-icons/hi2",
      "react-icons/im",
      "react-icons/io",
      "react-icons/io5",
      "react-icons/lia",
      "react-icons/lu",
      "react-icons/md",
      "react-icons/pi",
      "react-icons/ri",
      "react-icons/rx",
      "react-icons/si",
      "react-icons/sl",
      "react-icons/tb",
      "react-icons/tfi",
      "react-icons/ti",
      "react-icons/vsc",
      "react-icons/wi",
    ],
  },
  // 5) HTTP headers — 静态资源永久缓存, 安全头
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        // 通用安全 + 性能头 (覆盖所有路径)
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 不再加 X-Frame-Options (依赖 CSP), 不加 HSTS (nginx 已经加)
        ],
      },
    ];
  },
};

export default nextConfig;