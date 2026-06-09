"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
  foldGutter,
  foldKeymap,
  HighlightStyle,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import {
  Bold,
  Italic,
  Code,
  Link2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// VitePress 风格的暗色高亮 (适配站点设计)
const vpDarkHighlight = HighlightStyle.define([
  { tag: t.heading1, color: "#a78bfa", fontWeight: "700" },
  { tag: t.heading2, color: "#a78bfa", fontWeight: "700" },
  { tag: t.heading3, color: "#a78bfa", fontWeight: "600" },
  { tag: t.heading, color: "#a78bfa", fontWeight: "600" },
  { tag: t.link, color: "#22d3ee", textDecoration: "underline" },
  { tag: t.url, color: "#22d3ee" },
  { tag: t.emphasis, fontStyle: "italic", color: "#c4b5fd" },
  { tag: t.strong, fontWeight: "700", color: "#f5f3ff" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "#737373" },
  { tag: t.monospace, color: "#fbbf24" },
  { tag: t.quote, color: "#a3a3a3", fontStyle: "italic" },
  { tag: t.list, color: "#a78bfa" },
  { tag: t.processingInstruction, color: "#a78bfa" },
  { tag: t.contentSeparator, color: "#525252" },
  { tag: t.atom, color: "#fb923c" },
  { tag: t.meta, color: "#94a3b8" },
  { tag: t.comment, color: "#737373", fontStyle: "italic" },
]);

const vpLightHighlight = HighlightStyle.define([
  { tag: t.heading1, color: "#7c3aed", fontWeight: "700" },
  { tag: t.heading2, color: "#7c3aed", fontWeight: "700" },
  { tag: t.heading3, color: "#7c3aed", fontWeight: "600" },
  { tag: t.heading, color: "#7c3aed", fontWeight: "600" },
  { tag: t.link, color: "#0891b2", textDecoration: "underline" },
  { tag: t.url, color: "#0891b2" },
  { tag: t.emphasis, fontStyle: "italic", color: "#6d28d9" },
  { tag: t.strong, fontWeight: "700", color: "#171717" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "#737373" },
  { tag: t.monospace, color: "#b45309" },
  { tag: t.quote, color: "#737373", fontStyle: "italic" },
  { tag: t.list, color: "#7c3aed" },
  { tag: t.contentSeparator, color: "#a3a3a3" },
  { tag: t.atom, color: "#c2410c" },
  { tag: t.comment, color: "#737373", fontStyle: "italic" },
]);

const vpTheme = EditorView.theme(
  {
    "&": {
      fontSize: "14px",
      lineHeight: "1.7",
    },
    ".cm-content": {
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      padding: "16px 0",
    },
    ".cm-line": {
      padding: "0 16px",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(139, 92, 246, 0.06)",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      border: "none",
      color: "#a3a3a3",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "#7c3aed",
    },
    ".cm-cursor": {
      borderLeftColor: "#7c3aed",
      borderLeftWidth: "2px",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(139, 92, 246, 0.18)",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      border: "none",
      color: "#7c3aed",
    },
  },
  { dark: false }
);

const vpDarkTheme = EditorView.theme(
  {
    "&": {
      fontSize: "14px",
      lineHeight: "1.7",
    },
    ".cm-content": {
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      padding: "16px 0",
    },
    ".cm-line": {
      padding: "0 16px",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(139, 92, 246, 0.08)",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      border: "none",
      color: "#525252",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "#a78bfa",
    },
    ".cm-cursor": {
      borderLeftColor: "#a78bfa",
      borderLeftWidth: "2px",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(139, 92, 246, 0.25)",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      border: "none",
      color: "#a78bfa",
    },
  },
  { dark: true }
);

interface MDXEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** 主题: 'auto' 跟随系统, 'light', 'dark' */
  theme?: "auto" | "light" | "dark";
  /** 草稿 key (用于 localStorage 暂存) */
  draftKey: string;
  /** 防抖毫秒, 默认 500 */
  debounceMs?: number;
  /** 高度, 默认 500px */
  minHeight?: string;
}

export function MDXEditor({
  value,
  onChange,
  theme = "auto",
  draftKey,
  debounceMs = 500,
  minHeight = "500px",
}: MDXEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState({ chars: 0, lines: 0, line: 1, col: 1 });
  const [draftSaved, setDraftSaved] = useState(false);

  // 主题检测: 'auto' 跟随 HTML 是否有 .dark 类
  useEffect(() => {
    if (theme !== "auto") {
      setIsDark(theme === "dark");
      return;
    }
    const check = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [theme]);

  // 草稿恢复检测
  useEffect(() => {
    if (!draftKey) return;
    const stored = localStorage.getItem(`mdx-draft-${draftKey}`);
    if (!stored) return;
    try {
      const { content, timestamp } = JSON.parse(stored);
      // 草稿跟当前不同,提示用户
      if (content && content !== value && Date.now() - timestamp < 7 * 24 * 3600 * 1000) {
        const age = Math.round((Date.now() - timestamp) / 60000);
        const useIt = confirm(
          `检测到未保存的草稿(约 ${age} 分钟前),要恢复吗?\n\n点"确定"用草稿,点"取消"放弃。`
        );
        if (useIt) {
          onChange(content);
        } else {
          localStorage.removeItem(`mdx-draft-${draftKey}`);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // CodeMirror 初始化
  useEffect(() => {
    if (!containerRef.current) return;

    const themeCompartment = new Compartment();
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        history(),
        foldGutter(),
        bracketMatching(),
        indentOnInput(),
        drawSelection(),
        EditorView.lineWrapping,
        keymap.of([
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...foldKeymap,
        ]),
        markdown({ base: markdownLanguage, codeLanguages: () => null }),
        syntaxHighlighting(isDark ? vpDarkHighlight : vpLightHighlight, { fallback: true }),
        themeCompartment.of(isDark ? vpDarkTheme : vpTheme),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            onChange(newValue);
            updateStats(update.state);
          } else if (update.selectionSet || update.viewportMoved) {
            updateStats(update.state);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;
    updateStats(state);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // 外部 value 变化时同步到编辑器(避免循环)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // 草稿自动保存 (防抖 800ms)
  useEffect(() => {
    if (!draftKey) return;
    const t = setTimeout(() => {
      if (value && value.length > 0) {
        localStorage.setItem(
          `mdx-draft-${draftKey}`,
          JSON.stringify({ content: value, timestamp: Date.now() })
        );
        setDraftSaved(true);
        const tt = setTimeout(() => setDraftSaved(false), 2000);
        return () => clearTimeout(tt);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [value, draftKey]);

  function updateStats(state: EditorState) {
    const text = state.doc.toString();
    const lines = state.doc.lines;
    // 简单估算字数 (去除空白)
    const chars = text.replace(/\s/g, "").length;
    // 光标位置
    const pos = state.selection.main.head;
    const lineInfo = state.doc.lineAt(pos);
    const col = pos - lineInfo.from + 1;
    setStats({ chars, lines, line: lineInfo.number, col });
  }

  // 工具栏动作: 在选中文本周围插入符号
  const wrap = useCallback(
    (before: string, after: string = before, placeholder = "文本") => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      const content = selected || placeholder;
      const insert = before + content + after;
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + before.length, head: from + before.length + content.length },
      });
      view.focus();
    },
    []
  );

  const insertLinePrefix = useCallback(
    (prefix: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      const lineStart = line.from;
      view.dispatch({
        changes: { from: lineStart, insert: prefix },
        selection: { anchor: from + prefix.length },
      });
      view.focus();
    },
    []
  );

  const undo = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    // 用 doTransaction 模式触发 undo
    import("@codemirror/commands").then(({ undo: cmUndo }) => cmUndo(view));
    view.focus();
  }, []);

  const redo = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    import("@codemirror/commands").then(({ redo: cmRedo }) => cmRedo(view));
    view.focus();
  }, []);

  const clearDraft = useCallback(() => {
    if (!draftKey) return;
    if (confirm("确定要清空本地草稿吗?(不影响服务器内容)")) {
      localStorage.removeItem(`mdx-draft-${draftKey}`);
    }
  }, [draftKey]);

  return (
    <div className="rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50/80 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-900/80">
        <ToolbarButton icon={Heading1} label="标题 1" onClick={() => insertLinePrefix("# ")} />
        <ToolbarButton icon={Heading2} label="标题 2" onClick={() => insertLinePrefix("## ")} />
        <ToolbarButton icon={Heading3} label="标题 3" onClick={() => insertLinePrefix("### ")} />
        <Divider />
        <ToolbarButton icon={Bold} label="粗体 (Ctrl+B)" onClick={() => wrap("**", "**", "粗体")} />
        <ToolbarButton icon={Italic} label="斜体 (Ctrl+I)" onClick={() => wrap("*", "*", "斜体")} />
        <ToolbarButton icon={Strikethrough} label="删除线" onClick={() => wrap("~~", "~~", "删除线")} />
        <Divider />
        <ToolbarButton icon={Link2} label="链接 (Ctrl+K)" onClick={() => wrap("[", "](https://)", "链接文字")} />
        <ToolbarButton icon={Code} label="行内代码" onClick={() => wrap("`", "`", "code")} />
        <Divider />
        <ToolbarButton icon={List} label="无序列表" onClick={() => insertLinePrefix("- ")} />
        <ToolbarButton icon={ListOrdered} label="有序列表" onClick={() => insertLinePrefix("1. ")} />
        <ToolbarButton icon={Quote} label="引用" onClick={() => insertLinePrefix("> ")} />
        <div className="flex-1" />
        <ToolbarButton icon={RotateCcw} label="撤销 (Ctrl+Z)" onClick={undo} />
        <ToolbarButton icon={RotateCw} label="重做 (Ctrl+Shift+Z)" onClick={redo} />
        <Divider />
        <ToolbarButton
          icon={draftSaved ? Check : Save}
          label={draftSaved ? "草稿已保存" : "草稿自动保存中"}
          onClick={clearDraft}
          className={cn(
            draftSaved
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-neutral-500 dark:text-neutral-400"
          )}
        />
      </div>

      {/* 编辑器本体 */}
      <div
        ref={containerRef}
        style={{ minHeight }}
        className="overflow-auto"
      />

      {/* 状态栏 */}
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-3 py-1.5 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
        <div className="flex items-center gap-3 tabular-nums">
          <span>行 {stats.line} / {stats.lines}</span>
          <span>列 {stats.col}</span>
          <span>{stats.chars.toLocaleString()} 字</span>
        </div>
        <div className="flex items-center gap-3">
          {draftSaved ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              草稿已存
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              自动保存…
            </span>
          )}
          <span>MDX · 快捷键 Ctrl+B / Ctrl+I / Ctrl+K / Ctrl+S</span>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded text-neutral-600 transition hover:bg-white hover:text-neutral-900 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />;
}
