"use client";

/**
 * Python 在线执行 (Pyodide)
 * - 浏览器里跑 Python (无需后端)
 * - 首次加载约 5-10MB, 之后缓存
 * - 支持 print, 数学运算, 基础数据结构
 * - 不支持第三方 pip 包 (除 numpy 预装)
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, Play, RotateCcw, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { cn } from "@/lib/utils";

interface Props {
  /** 初始代码 */
  initialCode?: string;
  /** 标题 */
  title?: string;
  description?: string;
  className?: string;
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

print("\\n", greet("同学"))
`;

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<any>;
  }
}

let pyodideInstance: any = null;
let loadingPromise: Promise<any> | null = null;

async function loadPyodideOnce() {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    if (!window.loadPyodide) {
      // 注入脚本
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Pyodide 加载失败"));
        document.head.appendChild(script);
      });
    }
    if (!window.loadPyodide) throw new Error("Pyodide 未安装");
    pyodideInstance = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
    });
    // 捕获 stdout
    pyodideInstance.setStdout({
      batched: (text: string) => {
        const ev = new CustomEvent("pyodide-stdout", { detail: text });
        window.dispatchEvent(ev);
      },
    });
    pyodideInstance.setStderr({
      batched: (text: string) => {
        const ev = new CustomEvent("pyodide-stderr", { detail: text });
        window.dispatchEvent(ev);
      },
    });
    return pyodideInstance;
  })();
  return loadingPromise;
}

export function PythonRunner({ initialCode = DEFAULT_CODE, title = "Python 演练场", description, className }: Props) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // 监听 stdout/stderr
  useEffect(() => {
    const onStdout = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOutput((prev) => prev + detail + "\n");
    };
    const onStderr = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOutput((prev) => prev + "[stderr] " + detail + "\n");
    };
    window.addEventListener("pyodide-stdout", onStdout);
    window.addEventListener("pyodide-stderr", onStderr);
    return () => {
      window.removeEventListener("pyodide-stdout", onStdout);
      window.removeEventListener("pyodide-stderr", onStderr);
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCode = async () => {
    setOutput("");
    setError(null);
    setRunning(true);
    setLoading(!loaded);
    try {
      const pyodide = await loadPyodideOnce();
      setLoaded(true);
      setLoading(false);
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

  return (
    <Card className={cn("my-6", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary-600" />
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 代码区 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">代码 (Python)</span>
              <div className="flex gap-2">
                <Button onClick={reset} variant="ghost" size="sm">
                  <RotateCcw className="h-3 w-3" />
                  重置
                </Button>
                <Button onClick={runCode} disabled={running} size="sm">
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      加载中...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      运行
                    </>
                  )}
                </Button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="h-80 w-full rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs leading-relaxed text-neutral-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-primary-700 dark:focus:ring-primary-900"
            />
          </div>

          {/* 输出区 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">输出</span>
              <Button onClick={() => setOutput("")} variant="ghost" size="sm">
                清空
              </Button>
            </div>
            <div
              ref={outputRef}
              className="h-80 overflow-auto rounded-md border border-neutral-200 bg-neutral-900 p-3 font-mono text-xs leading-relaxed text-neutral-100 dark:border-neutral-800"
            >
              {output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <span className="text-neutral-500">// 点"运行"执行代码</span>
              )}
              {error && (
                <pre className="mt-2 whitespace-pre-wrap text-red-400">Error: {error}</pre>
              )}
            </div>
          </div>
        </div>

        <Callout type="info" className="mt-4">
          <p className="text-xs">
            <strong>说明</strong>: 用的是 <a href="https://pyodide.org" target="_blank" rel="noreferrer" className="underline">Pyodide</a>(CPython 编译到 WebAssembly)。首次加载约 5-10 MB, 之后会缓存。
            支持 Python 标准库 + NumPy, 但不能用 <code>pip install</code> 装其他包。
          </p>
        </Callout>
      </CardContent>
    </Card>
  );
}

export default PythonRunner;
