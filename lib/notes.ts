// 学习笔记 helper
import { prisma } from "./db";

export type NoteColor = "yellow" | "red" | "green" | "blue";

interface CreateOpts {
  userId: string;
  courseSlug: string;
  chapterSlug: string;
  highlightedText: string;
  content: string;
  color?: NoteColor;
}

export async function createNote(opts: CreateOpts) {
  if (!opts.highlightedText.trim()) return { ok: false as const, error: "请先选中要标记的文本" };
  if (!opts.content.trim()) return { ok: false as const, error: "请输入笔记内容" };
  if (opts.highlightedText.length > 5000) return { ok: false as const, error: "高亮文本过长" };
  if (opts.content.length > 2000) return { ok: false as const, error: "笔记内容超过 2000 字" };
  const note = await prisma.note.create({
    data: {
      userId: opts.userId,
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug,
      highlightedText: opts.highlightedText.trim().slice(0, 5000),
      content: opts.content.trim().slice(0, 2000),
      color: opts.color ?? "yellow",
    },
  });
  return { ok: true as const, data: note };
}

export async function listNotes(opts: { userId: string; courseSlug: string; chapterSlug: string }) {
  return prisma.note.findMany({
    where: {
      userId: opts.userId,
      courseSlug: opts.courseSlug,
      chapterSlug: opts.chapterSlug,
      status: "active",
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateNote(opts: {
  id: string;
  userId: string;
  content?: string;
  color?: NoteColor;
}) {
  const n = await prisma.note.findUnique({ where: { id: opts.id } });
  if (!n) return { ok: false as const, error: "笔记不存在" };
  if (n.userId !== opts.userId) return { ok: false as const, error: "无权编辑" };
  if (opts.content && (opts.content.length < 1 || opts.content.length > 2000)) {
    return { ok: false as const, error: "笔记内容必须在 1-2000 字" };
  }
  const updated = await prisma.note.update({
    where: { id: opts.id },
    data: {
      ...(opts.content !== undefined ? { content: opts.content.trim() } : {}),
      ...(opts.color ? { color: opts.color } : {}),
    },
  });
  return { ok: true as const, data: updated };
}

export async function deleteNote(opts: { id: string; userId: string }) {
  const n = await prisma.note.findUnique({ where: { id: opts.id } });
  if (!n) return { ok: false as const, error: "笔记不存在" };
  if (n.userId !== opts.userId) return { ok: false as const, error: "无权删除" };
  await prisma.note.update({
    where: { id: opts.id },
    data: { status: "deleted" },
  });
  return { ok: true as const };
}
