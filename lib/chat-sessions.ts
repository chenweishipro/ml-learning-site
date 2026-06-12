// Chat session 管理
import { prisma } from "./db";

export interface Citation {
  courseSlug: string;
  courseTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  snippet: string;
  score: number;
}

export async function listSessions(userId: string, limit = 50) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function getSession(userId: string, sessionId: string) {
  return prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createSession(userId: string, title: string) {
  return prisma.chatSession.create({
    data: { userId, title: title.slice(0, 100) || "新对话" },
  });
}

export async function deleteSession(userId: string, sessionId: string) {
  return prisma.chatSession.deleteMany({ where: { id: sessionId, userId } });
}

export async function renameSession(userId: string, sessionId: string, title: string) {
  return prisma.chatSession.updateMany({
    where: { id: sessionId, userId },
    data: { title: title.slice(0, 100) },
  });
}

export async function appendMessage(
  userId: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  citations?: Citation[]
) {
  // 顺便更新 session.updatedAt
  await prisma.chatSession.updateMany({
    where: { id: sessionId, userId },
    data: { updatedAt: new Date() },
  });
  return prisma.chatMessage.create({
    data: {
      userId,
      sessionId,
      role,
      content,
      citations: citations ? JSON.stringify(citations) : null,
    },
  });
}
