"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { Calendar, Check, Loader2, Sparkles, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function DailyChallengeClient() {
  const { user, ready } = useAuth();
  const [questions, setQuestions] = useState<DailyQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/daily-challenge/");
      const j = await r.json();
      if (j.ok) setQuestions(j.data.questions);
      setLoading(false);
    })();
  }, []);

  const score = questions.reduce((s, item, i) => s + (answers[i] === item.correct ? 1 : 0), 0);
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);

  async function submit() {
    setSubmitted(true);
    if (!user) return;
    try {
      await fetch("/api/quiz/attempt", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: "_daily",
          chapterSlug: today,
          totalCorrect: score,
          totalQuestions: questions.length,
          timeSpent: 0,
        }),
      });
    } catch {}
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl py-20 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
        <p className="mt-2 text-sm text-neutral-500">加载题库中...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl py-20 text-center">
        <p className="text-sm text-neutral-500">题库为空, 请先访问任意课程加载题库。</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-medium text-white">
          <Sparkles className="h-3 w-3" />
          每日挑战
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{today}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          每天 3 道题, 巩固学习成果。所有用户当天的题目相同, 比比谁分高。
        </p>
      </header>

      {!submitted && (
        <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
          <span><Calendar className="mr-1 inline h-3 w-3" />已完成 {Object.keys(answers).length} / {questions.length}</span>
          {ready && user ? null : (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50">
              登录后自动记录成绩
            </span>
          )}
        </div>
      )}

      <ul className="space-y-4">
        {questions.map((item, qi) => {
          const { chapterId, chapterTitle } = item;
          const userAnswer = answers[qi];
          const isCorrect = submitted && userAnswer === item.correct;
          const isWrong = submitted && userAnswer !== undefined && userAnswer !== item.correct;
          return (
            <li key={qi} className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                  {qi + 1}
                </span>
                来自
                {chapterTitle ? (
                  <a href={`/courses/${chapterId}/`} className="text-primary-700 hover:underline dark:text-primary-300">
                    {chapterTitle}
                  </a>
                ) : null}
              </div>
              <p className="mb-3 text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-100">
                {item.question}
              </p>
              <div className="space-y-1.5">
                {item.options.map((opt, oi) => {
                  const isSelected = userAnswer === oi;
                  const showCorrect = submitted && oi === item.correct;
                  const showWrong = submitted && isSelected && oi !== item.correct;
                  return (
                    <button
                      key={oi}
                      onClick={() => !submitted && setAnswers((p) => ({ ...p, [qi]: oi }))}
                      disabled={submitted}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition disabled:cursor-default",
                        !submitted && !isSelected && "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 dark:border-neutral-800 dark:bg-neutral-900",
                        !submitted && isSelected && "border-primary-500 bg-primary-50 ring-1 ring-primary-300 dark:bg-primary-950/30 dark:ring-primary-700",
                        showCorrect && "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200",
                        showWrong && "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
                      )}
                    >
                      <span className={cn(
                        "mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-mono",
                        !submitted && !isSelected && "border-neutral-300 text-neutral-500",
                        !submitted && isSelected && "border-primary-600 bg-primary-600 text-white",
                        showCorrect && "border-emerald-600 bg-emerald-600 text-white",
                        showWrong && "border-red-600 bg-red-600 text-white"
                      )}>
                        {showCorrect ? <Check className="h-3 w-3" /> : showWrong ? <X className="h-3 w-3" /> : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && item.explanation && (
                <div className="mt-3 rounded-md bg-neutral-50 p-2.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  💡 {item.explanation}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:from-neutral-300 disabled:to-neutral-400 disabled:text-neutral-500 dark:disabled:from-neutral-700 dark:disabled:to-neutral-800"
        >
          {allAnswered ? <><Trophy className="h-4 w-4" />提交并查看成绩</> : <>请先答完所有题目 ({Object.keys(answers).length}/{questions.length})</>}
        </button>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-amber-50 p-6 text-center dark:border-primary-700 dark:from-primary-950/30 dark:to-amber-950/30">
          <div className="text-5xl">🎉</div>
          <div className="mt-2 text-2xl font-bold">
            你的得分:{" "}
            <span className="bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
              {score} / {questions.length}
            </span>
          </div>
          <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            正确率 {Math.round((score / questions.length) * 100)}%
            {user ? " · 已记录到排行榜" : " · 登录后自动记录"}
          </div>
          <button
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            🔄 再来一遍 (看自己能否全对)
          </button>
        </div>
      )}
    </div>
  );
}
