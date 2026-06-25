/** /api/daily-challenge - 返回今日 3 题 (基于 date seed 确定性) */
import { QUIZZES } from "@/lib/quizzes";
import { courses } from "@/content/courses/_index";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DailyQ {
  chapterId: string;
  chapterTitle: string;
  courseTitle: string;
  courseSlug: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

function pickQuestions(seed: number, count = 3): DailyQ[] {
  const flat: Array<{ chapterId: string; courseSlug: string; courseTitle: string; chapterTitle: string; q: any }> = [];
  for (const [chapterId, qs] of Object.entries(QUIZZES)) {
    const [courseSlug, chapterSlug] = chapterId.split("/");
    const course = courses.find((c) => c.slug === courseSlug);
    const chapter = course?.chapters.find((c) => c.slug === chapterSlug);
    if (!course || !chapter) continue;
    for (const q of qs) {
      flat.push({ chapterId, courseSlug, courseTitle: course.title, chapterTitle: chapter.title, q });
    }
  }
  const arr = [...flat];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count).map((x) => ({
    chapterId: x.chapterId,
    courseSlug: x.courseSlug,
    courseTitle: x.courseTitle,
    chapterTitle: x.chapterTitle,
    question: x.q.question,
    options: x.q.options,
    correct: x.q.correct,
    explanation: x.q.explanation,
  }));
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (const ch of today) h = h * 31 + ch.charCodeAt(0);
  const questions = pickQuestions(h, 3);
  return ok({ date: today, questions });
}
