// 简单的行级 diff (基于 LCS 算法)
// 输出每个 diff 块: { type: "context" | "add" | "remove", lines: string[] }

export type DiffOpType = "context" | "add" | "remove";

export interface DiffLine {
  type: DiffOpType;
  /** 原始行内容 (无前导 +/-/空格) */
  text: string;
  /** 旧文件中的行号 (从 1 开始), 仅在 context 和 remove 时有意义 */
  oldLine: number | null;
  /** 新文件中的行号 (从 1 开始), 仅在 context 和 add 时有意义 */
  newLine: number | null;
}

export interface DiffSummary {
  added: number;
  removed: number;
  unchanged: number;
}

/**
 * 计算两段文本的行级 diff
 * 用最长公共子序列 (LCS) 算法, O(n*m) 时间复杂度
 * 对 < 5000 行的文档够用
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const m = a.length;
  const n = b.length;

  // 1) LCS 动态规划表
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 2) 回溯生成 diff
  const out: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.push({ type: "context", text: a[i - 1], oldLine: i, newLine: j });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.push({ type: "remove", text: a[i - 1], oldLine: i, newLine: null });
      i--;
    } else {
      out.push({ type: "add", text: b[j - 1], oldLine: null, newLine: j });
      j--;
    }
  }
  while (i > 0) {
    out.push({ type: "remove", text: a[i - 1], oldLine: i, newLine: null });
    i--;
  }
  while (j > 0) {
    out.push({ type: "add", text: b[j - 1], oldLine: null, newLine: j });
    j--;
  }

  out.reverse();
  return out;
}

export function summarize(diff: DiffLine[]): DiffSummary {
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const d of diff) {
    if (d.type === "add") added++;
    else if (d.type === "remove") removed++;
    else unchanged++;
  }
  return { added, removed, unchanged };
}

/**
 * 把连续相同类型的 diff 行合并成"块" (用于 UI 折叠)
 */
export interface DiffBlock {
  type: "context" | "add" | "remove" | "mixed";
  lines: DiffLine[];
  oldStart: number | null;
  newStart: number | null;
}

export function groupByBlocks(diff: DiffLine[], contextSize = 3): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let i = 0;
  while (i < diff.length) {
    const d = diff[i];
    if (d.type === "context") {
      // 收集连续 context (但限制在 contextSize)
      const chunk: DiffLine[] = [];
      let j = i;
      while (j < diff.length && diff[j].type === "context" && chunk.length < contextSize) {
        chunk.push(diff[j]);
        j++;
      }
      // 看是否后面有 add/remove
      let k = j;
      while (k < diff.length && diff[k].type === "context" && chunk.length < contextSize * 2) {
        // 看看是否这一行后面紧跟着 add/remove
        let lookahead = k;
        while (
          lookahead < diff.length &&
          diff[lookahead].type === "context" &&
          lookahead - k < contextSize
        ) {
          lookahead++;
        }
        if (lookahead < diff.length && diff[lookahead].type !== "context") {
          chunk.push(diff[k]);
          k++;
        } else {
          break;
        }
      }
      // 如果有剩余 context, 用 "..." 标记
      if (j < diff.length && diff[j].type === "context") {
        const totalContext = countConsecutiveContext(diff, j);
        if (totalContext > chunk.length) {
          // 标记这是一个长 context 块
          chunk.push({
            type: "context",
            text: `... (省略 ${totalContext - chunk.length} 行未改动)`,
            oldLine: null,
            newLine: null,
          });
          // 跳过剩余的 context 行
          i = j + totalContext;
        } else {
          i = j;
        }
      } else {
        i = j;
      }
      blocks.push({
        type: "context",
        lines: chunk,
        oldStart: chunk[0]?.oldLine ?? null,
        newStart: chunk[0]?.newLine ?? null,
      });
    } else {
      // 收集 add/remove 块
      const chunk: DiffLine[] = [];
      while (i < diff.length && diff[i].type !== "context") {
        chunk.push(diff[i]);
        i++;
      }
      blocks.push({
        type: chunk.some((x) => x.type === "add") && chunk.some((x) => x.type === "remove")
          ? "mixed"
          : chunk[0].type,
        lines: chunk,
        oldStart: chunk.find((x) => x.oldLine !== null)?.oldLine ?? null,
        newStart: chunk.find((x) => x.newLine !== null)?.newLine ?? null,
      });
    }
  }
  return blocks;
}

function countConsecutiveContext(diff: DiffLine[], from: number): number {
  let n = 0;
  while (from + n < diff.length && diff[from + n].type === "context") n++;
  return n;
}
