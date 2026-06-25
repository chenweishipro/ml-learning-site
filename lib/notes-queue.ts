/** v16.3 离线笔记队列 — IndexedDB 暂存, 在线后自动同步 */

const DB_NAME = "ml-notes";
const DB_VERSION = 1;
const STORE_PENDING = "pending-notes";

export interface PendingNote {
  /** 临时客户端 ID (用于 dedup) */
  clientId: string;
  courseSlug: string;
  chapterSlug: string;
  highlightedText: string;
  content: string;
  color: string;
  /** 本地创建时间 */
  createdAt: number;
  /** 已尝试同步次数 */
  retries: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no IDB"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: "clientId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result: T;
    Promise.resolve(fn(s)).then((r) => (result = r)).catch(reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}

function genClientId(): string {
  return `cn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 把笔记加入待同步队列, 返回 clientId */
export async function enqueueNote(input: Omit<PendingNote, "clientId" | "createdAt" | "retries">): Promise<PendingNote> {
  const note: PendingNote = {
    ...input,
    clientId: genClientId(),
    createdAt: Date.now(),
    retries: 0,
  };
  try {
    await tx(STORE_PENDING, "readwrite", (s) => {
      s.put(note);
    });
  } catch (e) {
    // 存储失败用临时 ID
    console.warn("note queue write failed", e);
  }
  return note;
}

/** 取出所有待同步笔记 */
export async function getPending(): Promise<PendingNote[]> {
  try {
    return await tx<PendingNote[]>(STORE_PENDING, "readonly", (s) => {
      return new Promise((resolve) => {
        const out: PendingNote[] = [];
        const req = s.openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (!c) {
            out.sort((a, b) => a.createdAt - b.createdAt);
            resolve(out);
            return;
          }
          out.push(c.value as PendingNote);
          c.continue();
        };
        req.onerror = () => resolve([]);
      });
    });
  } catch {
    return [];
  }
}

/** 同步成功后删除 */
export async function removePending(clientId: string): Promise<void> {
  try {
    await tx(STORE_PENDING, "readwrite", (s) => {
      s.delete(clientId);
    });
  } catch {}
}

/** 同步失败, 累加 retries */
export async function bumpRetries(clientId: string): Promise<void> {
  try {
    await tx(STORE_PENDING, "readwrite", (s) => {
      const req = s.get(clientId);
      req.onsuccess = () => {
        const v = req.result as PendingNote | undefined;
        if (!v) return;
        v.retries += 1;
        s.put(v);
      };
    });
  } catch {}
}

/** 队列长度 (用于 UI 显示) */
export async function pendingCount(): Promise<number> {
  const all = await getPending();
  return all.length;
}

/** 清空队列 (调试用) */
export async function clearAllPending(): Promise<void> {
  try {
    await tx(STORE_PENDING, "readwrite", (s) => s.clear());
  } catch {}
}
