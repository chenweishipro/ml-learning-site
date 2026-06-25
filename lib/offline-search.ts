/** v16.1 离线搜索 — IndexedDB 缓存 + 在线/离线切换 */

const DB_NAME = "ml-search";
const DB_VERSION = 1;
const STORE_HISTORY = "history";
const STORE_CACHE = "cache";
const CACHE_KEY = "search-index-v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

export interface SearchHistoryItem {
  q: string;
  ts: number;
}

export interface OfflineCacheEntry<T = unknown> {
  key: string;
  data: T;
  ts: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no IDB"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: "q" });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "key" });
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

export const isOnline = (): boolean => {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
};

/** 写入搜索历史 (最多 20 条) */
export async function recordSearch(q: string): Promise<void> {
  if (!q.trim()) return;
  try {
    await tx(STORE_HISTORY, "readwrite", (s) => {
      s.put({ q: q.trim(), ts: Date.now() });
    });
    // 截断到 20 条
    const all = await getHistory();
    if (all.length > 20) {
      const overflow = all.slice(20);
      await tx(STORE_HISTORY, "readwrite", (s) => {
        overflow.forEach((h) => s.delete(h.q));
      });
    }
  } catch {
    // IDB 不可用就忽略
  }
}

export async function getHistory(): Promise<SearchHistoryItem[]> {
  try {
    const items = await tx<SearchHistoryItem[]>(STORE_HISTORY, "readonly", (s) => {
      return new Promise((resolve) => {
        const out: SearchHistoryItem[] = [];
        const req = s.openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (!c) {
            out.sort((a, b) => b.ts - a.ts);
            resolve(out);
            return;
          }
          out.push(c.value as SearchHistoryItem);
          c.continue();
        };
        req.onerror = () => resolve([]);
      });
    });
    return items;
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await tx(STORE_HISTORY, "readwrite", (s) => s.clear());
  } catch {}
}

/** 缓存接口响应 (7 天 TTL) */
export async function cacheResponse<T>(key: string, data: T): Promise<void> {
  try {
    await tx(STORE_CACHE, "readwrite", (s) => {
      s.put({ key, data, ts: Date.now() });
    });
  } catch {}
}

export async function getCachedResponse<T = unknown>(key: string): Promise<{ data: T; ts: number } | null> {
  try {
    return await tx(STORE_CACHE, "readonly", (s) => {
      return new Promise((resolve) => {
        const req = s.get(key);
        req.onsuccess = () => {
          const v = req.result as OfflineCacheEntry<T> | undefined;
          if (!v) return resolve(null);
          if (Date.now() - v.ts > CACHE_TTL_MS) return resolve(null);
          resolve({ data: v.data, ts: v.ts });
        };
        req.onerror = () => resolve(null);
      });
    });
  } catch {
    return null;
  }
}
