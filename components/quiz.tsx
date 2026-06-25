"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Check, X, RotateCcw, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index of correct answer (0-based) */
  correct: number;
  explanation?: string;
}

export interface QuizProps {
  title?: string;
  description?: string;
  questions: QuizQuestion[];
  /** Optional chapter identifier for tracking */
  chapterId?: string;
}

export function Quiz({ title = "章末小测验", description, questions, chapterId }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.reduce((s, q, i) => {
    return s + (answers[i] === q.correct ? 1 : 0);
  }, 0);
  const percent = Math.round((score / questions.length) * 100);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  // 提交错题到后端 (useAuth 是 conditional, 但 React hook 必须在顶层)
  const { user } = useAuth();
  // 上次提交的错题集合 (避免重复存)
  const submitAttempt = async () => {
    if (!user || !chapterId) return;
    const [courseSlug, chapterSlug] = chapterId.split("/");
    if (!courseSlug || !chapterSlug) return;

    const correctCount = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);

    // 1) 提交 attempt
    try {
      await fetch("/api/quiz/attempt", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          chapterSlug,
          totalCorrect: correctCount,
          totalQuestions: questions.length,
          timeSpent: 0,
        }),
      });
    } catch (e) {
      // 静默失败
    }

    // 2) 提交错题
    const wrongItems = questions
      .map((q, i) => ({ q, i, answer: answers[i] }))
      .filter(({ q, i, answer }) => answer !== undefined && answer !== q.correct)
      .map(({ q, i, answer }) => ({ questionIndex: i, userAnswer: answer, correctAnswer: q.correct }));
    if (wrongItems.length === 0) return;
    try {
      await fetch("/api/quiz/wrong", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, chapterSlug, wrongItems }),
      });
    } catch (e) {
      // 静默失败
    }
  };

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  return (
    <Card className="my-8 ring-2 ring-primary-200/50 dark:ring-primary-800/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {questions.map((q, qi) => {
            const userAnswer = answers[qi];
            const isCorrect = submitted && userAnswer === q.correct;
            const isWrong = submitted && userAnswer !== undefined && userAnswer !== q.correct;
            return (
              <div key={qi}>
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {qi + 1}
                  </span>
                  <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                </div>
                <div className="ml-8 space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = userAnswer === oi;
                    const showCorrect = submitted && oi === q.correct;
                    const showWrong = submitted && isSelected && oi !== q.correct;
                    return (
                      <button
                        key={oi}
                        onClick={() => !submitted && setAnswers((p) => ({ ...p, [qi]: oi }))}
                        disabled={submitted}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition",
                          "disabled:cursor-default",
                          !submitted && !isSelected && "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/20",
                          !submitted && isSelected && "border-primary-500 bg-primary-50 text-primary-800 ring-1 ring-primary-300 dark:bg-primary-950/30 dark:text-primary-200 dark:ring-primary-700",
                          showCorrect && "border-accent-500 bg-accent-50 text-accent-800 dark:bg-accent-950/30 dark:text-accent-200",
                          showWrong && "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
                        )}
                      >
                        <span className={cn(
                          "mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-mono",
                          !submitted && !isSelected && "border-neutral-300 text-neutral-500",
                          !submitted && isSelected && "border-primary-600 bg-primary-600 text-white",
                          showCorrect && "border-accent-600 bg-accent-600 text-white",
                          showWrong && "border-red-600 bg-red-600 text-white"
                        )}>
                          {showCorrect ? <Check className="h-3 w-3" /> : showWrong ? <X className="h-3 w-3" /> : String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <div className={cn(
                    "ml-8 mt-2 rounded-md border-l-2 px-3 py-2 text-xs",
                    isCorrect
                      ? "border-accent-500 bg-accent-50/60 text-accent-900 dark:border-accent-700 dark:bg-accent-950/20 dark:text-accent-200"
                      : "border-amber-500 bg-amber-50/60 text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200"
                  )}>
                    <strong>{isCorrect ? "✓ 答对了!" : "✗ 再想想"}</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          <div className="ml-8 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {!submitted ? (
              <Button
                onClick={() => { setSubmitted(true); submitAttempt(); }}
                disabled={!allAnswered}
                size="md"
              >
                提交答案 {allAnswered ? "" : `(${[...Array(questions.length)].map((_, i) => answers[i] !== undefined).filter(Boolean).length}/${questions.length})`}
              </Button>
            ) : (
              <>
                <div className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold",
                  percent === 100
                    ? "bg-accent-100 text-accent-800 dark:bg-accent-950/40 dark:text-accent-200"
                    : percent >= 70
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                )}>
                  得分: {score} / {questions.length} ({percent}%)
                </div>
                <Button onClick={reset} variant="outline" size="sm">
                  <RotateCcw className="h-3.5 w-3.5" />
                  重做
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Quiz;
