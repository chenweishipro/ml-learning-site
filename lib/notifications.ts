// 站内信 (Notification) 工具
import { prisma } from "./db";

export type NotificationType =
  | "proposal_merged"
  | "proposal_rejected"
  | "proposal_approved"
  | "proposal_submitted"
  | "system";

interface CreateOpts {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  meta?: Record<string, unknown>;
}

/** 创建一条站内信 */
export async function createNotification(opts: CreateOpts) {
  return prisma.notification.create({
    data: {
      recipientId: opts.recipientId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link ?? null,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
    },
  });
}

/** 批量发送站内信 */
export async function createNotifications(items: CreateOpts[]) {
  if (items.length === 0) return [];
  return prisma.notification.createMany({
    data: items.map((it) => ({
      recipientId: it.recipientId,
      type: it.type,
      title: it.title,
      body: it.body,
      link: it.link ?? null,
      meta: it.meta ? JSON.stringify(it.meta) : null,
    })),
  });
}

/** 拿一个用户的通知 (倒序, 默认最多 50 条) */
export async function listNotifications(opts: { userId: string; limit?: number; onlyUnread?: boolean }) {
  return prisma.notification.findMany({
    where: {
      recipientId: opts.userId,
      ...(opts.onlyUnread ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
  });
}

/** 未读数 */
export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, readAt: null },
  });
}

/** 标记单条已读 */
export async function markRead(opts: { id: string; userId: string }) {
  return prisma.notification.updateMany({
    where: { id: opts.id, recipientId: opts.userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** 全部标记已读 */
export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
}
