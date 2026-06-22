/** Prometheus 风格 metrics — 监控用 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let requestCount = 0;
let errorCount = 0;
const start = Date.now();

export async function GET() {
  // 计数
  requestCount++;

  const [userCount, chapterCount, commentCount, inviteCount] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.chapterProgress.count().catch(() => 0),
    prisma.comment.count().catch(() => 0),
    prisma.newsletterSubscription.count().catch(() => 0),
  ]);

  const mem = process.memoryUsage();
  const metrics = [
    `# HELP ml_site_uptime_seconds Service uptime`,
    `# TYPE ml_site_uptime_seconds gauge`,
    `ml_site_uptime_seconds ${Math.floor((Date.now() - start) / 1000)}`,
    ``,
    `# HELP ml_site_requests_total Total requests handled`,
    `# TYPE ml_site_requests_total counter`,
    `ml_site_requests_total ${requestCount}`,
    ``,
    `# HELP ml_site_users_total Total registered users`,
    `# TYPE ml_site_users_total gauge`,
    `ml_site_users_total ${userCount}`,
    ``,
    `# HELP ml_site_chapter_progress_total Total chapter progress records`,
    `# TYPE ml_site_chapter_progress_total gauge`,
    `ml_site_chapter_progress_total ${chapterCount}`,
    ``,
    `# HELP ml_site_comments_total Total comments`,
    `# TYPE ml_site_comments_total gauge`,
    `ml_site_comments_total ${commentCount}`,
    ``,
    `# HELP ml_site_newsletter_total Total newsletter subscribers`,
    `# TYPE ml_site_newsletter_total gauge`,
    `ml_site_newsletter_total ${inviteCount}`,
    ``,
    `# HELP ml_site_memory_rss_bytes Resident set size`,
    `# TYPE ml_site_memory_rss_bytes gauge`,
    `ml_site_memory_rss_bytes ${mem.rss}`,
    ``,
    `# HELP ml_site_memory_heap_bytes Heap used`,
    `# TYPE ml_site_memory_heap_bytes gauge`,
    `ml_site_memory_heap_bytes ${mem.heapUsed}`,
  ].join("\n");

  return new NextResponse(metrics, {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4" },
  });
}
