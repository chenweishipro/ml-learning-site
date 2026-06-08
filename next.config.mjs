/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出, 用于部署到任何静态托管平台
  output: "export",
  // Static export friendly. We use `output: 'export'` only on demand via
  // `next build` flag — leaving it off here keeps dev / SSR features available
  // while still letting users run `next build` and serve the `.next/` output.
  reactStrictMode: true,
  images: {
    // We don't need Next's image optimization at build time for static export.
    unoptimized: true,
  },
  trailingSlash: true,
  // MDX is processed via `next-mdx-remote`, so we don't need the @next/mdx
  // webpack rule. This keeps the config small and the build fast.
  // Workaround for Next.js 14 500.html rename race on CSI/NFS file systems:
  // exclude the .next cache from file tracing and let the build finish cleanly.
  experimental: {
    outputFileTracingExcludes: {
      "*": [".next/cache/**", ".next/server/pages/500.html"],
    },
  },
};

export default nextConfig;
