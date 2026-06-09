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
  // Workaround for Next.js 14 500.html rename race on CSI/NFS file systems:
  // exclude the .next cache from file tracing and let the build finish cleanly.
  experimental: {
    outputFileTracingExcludes: {
      "*": [".next/cache/**", ".next/server/pages/500.html"],
    },
  },
};

export default nextConfig;
