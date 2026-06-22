/** 邮件简报 — 订阅 + 模板 + 发送 */
import { prisma } from "./db";
import { getAllCourses } from "./content";
import { isEmailConfigured, sendEmail } from "./email";
import { writeFile, appendFile } from "fs/promises";
import path from "path";

const LOG_FILE = process.env.NEWSLETTER_LOG_FILE || "/tmp/ml-newsletter.log";

export interface NewsletterContent {
  newChapters: Array<{ courseSlug: string; courseTitle: string; chapterSlug: string; chapterTitle: string; description: string }>;
  hotChapters: Array<{ courseSlug: string; chapterSlug: string; title: string; views: number }>;
  totalUsers: number;
  totalChapters: number;
  periodStart: Date;
  periodEnd: Date;
}

export async function buildWeeklyContent(): Promise<NewsletterContent> {
  const courses = getAllCourses();
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 新增章节: 用 chapter.lastUpdated 标记. 这里简单用全部 48 章作为 demo
  const newChapters: NewsletterContent["newChapters"] = [];
  for (const c of courses) {
    for (const ch of c.chapters) {
      newChapters.push({
        courseSlug: c.slug,
        courseTitle: c.title,
        chapterSlug: ch.slug,
        chapterTitle: ch.title,
        description: ch.description,
      });
    }
  }

  // 热门章节: 从 ChapterProgress 完成数排 (demo: 取前 5)
  const hot = await prisma.chapterProgress.groupBy({
    by: ["courseSlug", "chapterSlug"],
    where: { completed: true },
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: 5,
  }).catch(() => [] as any);
  const hotChapters = hot.map((h: any) => ({
    courseSlug: h.courseSlug,
    chapterSlug: h.chapterSlug,
    title: `${h.courseSlug} / ${h.chapterSlug}`,
    views: h._count.userId,
  }));

  const totalUsers = await prisma.user.count().catch(() => 0);

  return {
    newChapters: newChapters.slice(0, 8),
    hotChapters,
    totalUsers,
    totalChapters: newChapters.length,
    periodStart,
    periodEnd,
  };
}

export function renderNewsletter(opts: {
  email: string;
  displayName: string | null;
  content: NewsletterContent;
  baseUrl?: string;
}): { subject: string; html: string; text: string } {
  const base = opts.baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://122.51.221.63:7892";
  const greeting = opts.displayName ? `Hi ${opts.displayName},` : "Hi 同学,";
  const period = `${opts.content.periodStart.toLocaleDateString("zh-CN")} - ${opts.content.periodEnd.toLocaleDateString("zh-CN")}`;

  const subject = `ML 学习站 周报 (${period})`;

  const newList = opts.content.newChapters.slice(0, 5).map((c) => `
    <li style="margin-bottom:8px">
      <a href="${base}/courses/${c.courseSlug}/${c.chapterSlug}/" style="color:#7c3aed;text-decoration:none;font-weight:500">
        ${c.chapterTitle}
      </a>
      <span style="color:#737373;font-size:13px"> · ${c.courseTitle}</span>
      <div style="color:#525252;font-size:13px;margin-top:2px">${c.description}</div>
    </li>
  `).join("");

  const hotList = opts.content.hotChapters.length > 0
    ? opts.content.hotChapters.map((h) => `<li>${h.title} <span style="color:#737373">(${h.views} 人完成)</span></li>`).join("")
    : "<li style='color:#a3a3a3'>暂无数据</li>";

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#171717;background:#fafafa">
  <div style="background:#fff;padding:24px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
    <h1 style="margin:0 0 8px;font-size:22px;background:linear-gradient(90deg,#7c3aed,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent">
      📚 ML 学习站周报
    </h1>
    <p style="color:#737373;font-size:13px;margin:0 0 24px">${period}</p>

    <p style="line-height:1.7">${greeting}</p>
    <p style="line-height:1.7;color:#404040">
      这是本周的 ML 学习精选。我们平台现在已有 <strong>${opts.content.totalChapters} 个章节</strong>,
      服务 <strong>${opts.content.totalUsers}</strong> 位同学。
    </p>

    <h2 style="font-size:16px;margin:24px 0 12px;color:#171717">📖 本周精选章节</h2>
    <ul style="list-style:none;padding:0;margin:0">${newList}</ul>

    <h2 style="font-size:16px;margin:24px 0 12px;color:#171717">🔥 热门完成</h2>
    <ul style="color:#404040;line-height:1.8;padding-left:20px">${hotList}</ul>

    <div style="margin:32px 0;text-align:center">
      <a href="${base}/" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:500">
        继续学习 →
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
    <p style="color:#a3a3a3;font-size:12px;line-height:1.6">
      你收到这封邮件是因为你订阅了 ML 学习站周报。
      <a href="${base}/me/settings/" style="color:#7c3aed">修改订阅</a>
    </p>
  </div>
</div>`.trim();

  const text = [
    subject,
    "",
    `${greeting}`,
    "",
    `这是本周的 ML 学习精选。平台已有 ${opts.content.totalChapters} 个章节, 服务 ${opts.content.totalUsers} 位同学。`,
    "",
    "📖 本周精选章节:",
    ...opts.content.newChapters.slice(0, 5).map((c) => `  - ${c.chapterTitle} (${c.courseTitle})`),
    "",
    `更多请访问 ${base}/`,
    "",
    "— ML 学习站",
  ].join("\n");

  return { subject, html, text };
}

export async function sendNewsletter(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  userId: string;
}): Promise<{ status: "sent" | "failed" | "logged"; error?: string }> {
  if (isEmailConfigured()) {
    try {
      await sendEmail({ to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
      return { status: "sent" };
    } catch (e: any) {
      return { status: "failed", error: e?.message ?? "send failed" };
    }
  } else {
    // SMTP 未配置, 落到本地 log
    try {
      const line = `\n--- ${new Date().toISOString()} ---\nTo: ${opts.to}\nSubject: ${opts.subject}\n\n${opts.text}\n`;
      const targetPath = path.resolve(process.cwd(), "ml-newsletter.log");
      await appendFile(targetPath, line);
      return { status: "logged" as const };
    } catch (e: any) {
      return { status: "failed", error: e?.message ?? "log failed" };
    }
  }
}

export async function sendWeeklyToAll(opts: { dryRun?: boolean; baseUrl?: string; limit?: number } = {}) {
  const subs = await prisma.newsletterSubscription.findMany({
    where: { enabled: true },
    include: { user: { select: { id: true, email: true, displayName: true } } },
    take: opts.limit ?? 1000,
  });
  const content = await buildWeeklyContent();
  const stats = { total: subs.length, sent: 0, logged: 0, failed: 0, skipped: 0 };

  for (const sub of subs) {
    const { subject, html, text } = renderNewsletter({
      email: sub.user.email,
      displayName: sub.user.displayName,
      content,
      baseUrl: opts.baseUrl,
    });
    if (opts.dryRun) {
      stats.skipped++;
      continue;
    }
    const result = await sendNewsletter({ to: sub.user.email, subject, html, text, userId: sub.user.id });
    await prisma.newsletterLog.create({
      data: {
        userId: sub.user.id,
        subject,
        body: text.slice(0, 2000),
        status: result.status,
        error: result.error,
      },
    });
    if (result.status === "sent") stats.sent++;
    else if (result.status === "logged") stats.logged++;
    else stats.failed++;
    await new Promise((r) => setTimeout(r, 50));
  }
  return stats;
}
