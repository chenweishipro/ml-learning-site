"use client";

/**
 * 编程题组件
 *  - Monaco 编辑器写代码
 *  - 点击「运行」在浏览器 Pyodide 中跑测试
 *  - 全部通过 → 「提交」存到错题本 (跟 quiz 错题一样)
 *  - 失败显示哪条测试挂了 + 错误信息
 */
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Play, CheckCircle2, XCircle, Lightbulb, Code2, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { cn } from "@/lib/utils";
import type { CodingChallenge, CodingTest } from "@/lib/coding-challenges";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="grid h-64 place-items-center rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        加载代码编辑器...
      </div>
    </div>
  ),
});

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  easy: { label: "简单", color: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50" },
  medium: { label: "中等", color: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/50" },
  hard: { label: "困难", color: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800/50" },
};

export interface CodingChallengeProps {
  challenge: CodingChallenge;
  /** 是否自动提交到错题本 (默认 true) */
  autoSubmit?: boolean;
}

interface TestResult {
  name: string;
  hidden?: boolean;
  passed: boolean;
  error: string | null;
}

export function CodingChallenge({ challenge, autoSubmit = true }: CodingChallengeProps) {
  const [code, setCode] = useState(challenge.starterCode);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const allPassed = results && results.every((r) => r.passed);
  const passedCount = results?.filter((r) => r.passed).length ?? 0;
  const totalCount = results?.length ?? 0;

  const runTests = async () => {
    setRunning(true);
    setResults(null);
    try {
      const pyodide = await loadPyodide();
      pyodideRef.current = pyodide;
      const stdout: string[] = [];
      const stderr: string[] = [];
      pyodide.setStdout({ batched: (s: string) => stdout.push(s) });
      pyodide.setStderr({ batched: (s: string) => stderr.push(s) });
      // 注入用户代码
      pyodide.runPython(code);
      // 跑测试
      const out: TestResult[] = [];
      for (const test of challenge.tests) {
        try {
          pyodide.runPython(test.code);
          out.push({ name: test.name, hidden: test.hidden, passed: true, error: null });
        } catch (e: any) {
          out.push({ name: test.name, hidden: test.hidden, passed: false, error: String(e.message ?? e) });
        }
      }
      setResults(out);
    } catch (e: any) {
      setResults([{ name: "代码执行错误", passed: false, error: String(e.message ?? e) }]);
    } finally {
      setRunning(false);
    }
  };

  // 全部通过 → 自动提交
  useEffect(() => {
    if (allPassed && autoSubmit && !submitted) {
      setSubmitted(true);
      fetch("/api/coding/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          code,
          passed: true,
          passedTests: passedCount,
          totalTests: totalCount,
        }),
      }).catch(() => null);
    }
  }, [allPassed, autoSubmit, submitted, challenge.id, code, passedCount, totalCount]);

  const meta = DIFFICULTY_META[challenge.difficulty];

  return (
    <Card className="my-6 ring-2 ring-primary-200/50 dark:ring-primary-800/50">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Code2 className="h-5 w-5 text-primary-600" />
          <CardTitle>{challenge.title}</CardTitle>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", meta.color)}>
            {meta.label}
          </span>
          {allPassed && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
              <Trophy className="h-3 w-3" /> 全部通过
            </span>
          )}
        </div>
        <CardDescription className="whitespace-pre-line pt-2">{challenge.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
          <MonacoEditor
            height="320px"
            defaultLanguage="python"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            theme={theme === "dark" ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              lineNumbers: "on",
              tabSize: 4,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
            }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={runTests} disabled={running} size="md">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "跑测试中..." : "运行测试"}
          </Button>
          {challenge.hints && challenge.hints.length > 0 && (
            <Button onClick={() => setShowHints((v) => !v)} size="sm" variant="secondary">
              <Lightbulb className="h-3.5 w-3.5" /> 提示 ({challenge.hints.length})
            </Button>
          )}
          <Button onClick={() => setShowSolution((v) => !v)} size="sm" variant="ghost">
            参考解
          </Button>
          {results && (
            <span className={cn("ml-auto text-sm font-medium", allPassed ? "text-emerald-600" : "text-amber-600")}>
              {passedCount} / {totalCount} 通过
            </span>
          )}
        </div>

        {showHints && challenge.hints && (
          <Callout type="info" className="mt-3" title="提示">
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {challenge.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ol>
          </Callout>
        )}

        {showSolution && (
          <div className="mt-3 rounded-md border-l-4 border-amber-300 bg-amber-50/50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950/20">
            <div className="mb-1 font-semibold text-amber-700 dark:text-amber-300">参考解:</div>
            <pre className="overflow-x-auto text-xs">{challenge.solution}</pre>
          </div>
        )}

        {results && (
          <div className="mt-3 space-y-1.5">
            {results.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                  r.passed
                    ? "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200"
                    : "border-rose-200 bg-rose-50/60 text-rose-900 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-200"
                )}
              >
                {r.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {r.name} {r.hidden && <span className="text-[10px] text-neutral-500">(隐藏)</span>}
                  </div>
                  {r.error && <pre className="mt-1 overflow-x-auto text-[11px] text-rose-700 dark:text-rose-300">{r.error}</pre>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === Pyodide 加载 (单例) ===
let pyodidePromise: Promise<any> | null = null;
async function loadPyodide(): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Pyodide 脚本加载失败"));
        document.head.appendChild(s);
      });
    }
    return (window as any).loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
  })();
  return pyodidePromise;
}
