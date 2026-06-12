"use client";

/**
 * Python 在线执行 (Pyodide + Monaco Editor)
 * - VS Code 同款编辑器 (智能提示 / 语法高亮 / 行号 / 折叠)
 * - 浏览器里跑 Python (无需后端)
 * - 首次加载约 5-10MB, 之后缓存
 * - 支持 print, 数学运算, 基础数据结构
 * - 不支持第三方 pip 包 (除 numpy 预装)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2, Play, RotateCcw, Terminal, Download, Upload, Code2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { cn } from "@/lib/utils";

// Monaco 仅在 client side 加载 (避免 SSR)
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="grid h-64 place-items-center rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        加载 Monaco 编辑器...
      </div>
    </div>
  ),
});

interface Props {
  /** 初始代码 */
  initialCode?: string;
  /** 标题 */
  title?: string;
  description?: string;
  className?: string;
  /** 是否显示保存/加载按钮 (默认 false) */
  showFileOps?: boolean;
  /** Monaco 编辑器高度 (默认 360px) */
  height?: number;
}

const DEFAULT_CODE = `# 欢迎来到 Python 演练场!
# 在浏览器里直接跑 Python 代码, 不需要后端。

import math

# 1. 基本运算
print("2 + 3 =", 2 + 3)
print("2 的 10 次方 =", 2 ** 10)

# 2. 循环
print("\\n斐波那契数列前 10 项:")
a, b = 0, 1
for i in range(10):
    print(f"  F({i}) = {a}")
    a, b = b, a + b

# 3. 列表推导
squares = [i ** 2 for i in range(10)]
print("\\n前 10 个平方数:", squares)

# 4. 简单函数
def greet(name):
    return f"你好, {name}! 欢迎来到 ML 学习站 👋"

print(greet("同学"))
`;

export function PythonRunner({
  initialCode = DEFAULT_CODE,
  title = "Python 演练场",
  description,
  className,
  showFileOps = false,
  height = 360,
}: Props) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const outputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 主题跟随系统
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // 监听 stdout/stderr
  useEffect(() => {
    const onStdout = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOutput((prev) => prev + detail + "\n");
    };
    const onStderr = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOutput((prev) => prev + detail + "\n");
    };
    window.addEventListener("pyodide-stdout", onStdout);
    window.addEventListener("pyodide-stderr", onStderr);
    return () => {
      window.removeEventListener("pyodide-stdout", onStdout);
      window.removeEventListener("pyodide-stderr", onStderr);
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCode = async () => {
    setOutput("");
    setError(null);
    setRunning(true);
    try {
      const pyodide = await loadPyodideOnce();
      setLoaded(true);
      await pyodide.runPythonAsync(code);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setRunning(false);
      setLoading(false);
    }
  };

  const reset = () => {
    setCode(initialCode);
    setOutput("");
    setError(null);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snippet.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadCode = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCode(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = ""; // reset
  }, []);

  return (
    <Card className={cn("my-6", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary-600" />
          <CardTitle>{title}</CardTitle>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/50">
            <Code2 className="h-3 w-3" /> Monaco
          </span>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 代码区 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-neutral-500">代码 (Python · 智能补全)</div>
              <div className="flex items-center gap-1">
                {showFileOps && (
                  <>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      variant="ghost"
                      title="加载 .py 文件"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                    <Button onClick={downloadCode} size="sm" variant="ghost" title="下载代码">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".py,.txt" className="hidden" onChange={uploadCode} />
                  </>
                )}
                <Button onClick={reset} size="sm" variant="ghost" title="重置代码">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
              <MonacoEditor
                height={`${height}px`}
                defaultLanguage="python"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  lineNumbers: "on",
                  folding: true,
                  tabSize: 4,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  padding: { top: 12, bottom: 12 },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  tabFocusMode: false,
                  renderLineHighlight: "line",
                  cursorBlinking: "smooth",
                }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={runCode} disabled={running} size="md">
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {running ? (loading ? "加载 Python 中..." : "运行中") : "运行代码"}
              </Button>
              <span className="text-xs text-neutral-500">
                {loaded ? "✅ Python 已就绪" : "⏳ 首次运行会下载 ~10MB Pyodide"}
              </span>
            </div>
          </div>

          {/* 输出区 */}
          <div>
            <div className="mb-2 text-xs text-neutral-500">输出</div>
            <div
              ref={outputRef}
              className="h-[360px] overflow-auto rounded-md border border-neutral-200 bg-neutral-950 p-3 font-mono text-xs text-emerald-300 dark:border-neutral-800"
            >
              {output || <span className="text-neutral-600">点击「运行代码」查看输出...</span>}
            </div>
            {error && (
              <Callout type="warning" className="mt-2 text-xs">
                {error}
              </Callout>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// === Pyodide 加载 (单例) ===
let pyodidePromise: Promise<any> | null = null;

async function loadPyodideOnce(): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    // @ts-ignore — 来自 CDN, 全局 window.loadPyodide
    const loadPyodide = (window as any).loadPyodide;
    if (!loadPyodide) {
      // 注入 script 标签
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Pyodide 脚本加载失败"));
        document.head.appendChild(s);
      });
    }
    const pyodide = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
    });
    // 拦截 stdout/stderr
    pyodide.setStdout({
      batched: (s: string) => window.dispatchEvent(new CustomEvent("pyodide-stdout", { detail: s })),
    });
    pyodide.setStderr({
      batched: (s: string) => window.dispatchEvent(new CustomEvent("pyodide-stderr", { detail: s })),
    });
    return pyodide;
  })();
  return pyodidePromise;
}

export default PythonRunner;
