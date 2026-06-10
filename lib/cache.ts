// Redis 缓存层 (v8.5 性能优化)
// 用途: 缓存高 QPS 但变动不频繁的数据 (课程列表/章节目录/搜索结果)
import { createClient, type RedisClientType } from "redis";
import { promises as fs } from "fs";
import path from "path";

const CACHE_TTL_DEFAULT = 5 * 60; // 5 分钟 (秒)
const CACHE_TTL_FALLBACK = 60 * 1000; // 1 分钟内存 TTL

type CacheClient = RedisClientType | { type: "memory" };

let _client: CacheClient | null = null;
let _fileCacheDir: string | null = null;
const _memCache = new Map<string, { value: string; expiresAt: number }>();

function getFileCacheDir(): string {
  if (!_fileCacheDir) _fileCacheDir = path.join(process.cwd(), ".cache");
  return _fileCacheDir;
}

async function getClient(): Promise<CacheClient> {
  const url = process.env.REDIS_URL;
  if (!url) return { type: "memory" };
  if (_client) return _client;
  const client = createClient({ url });
  client.on("error", (err) => {
    console.warn("[cache] redis error, falling back:", err.message);
  });
  try {
    await client.connect();
    _client = client;
    console.log("[cache] connected to redis");
  } catch (e) {
    console.warn("[cache] redis unavailable, using file cache");
  }
  return _client ?? { type: "memory" };
}

async function fileGet(key: string): Promise<string | null> {
  try {
    const p = path.join(getFileCacheDir(), Buffer.from(key).toString("base64url") + ".json");
    const raw = await fs.readFile(p, "utf-8");
    const obj = JSON.parse(raw);
    if (obj.expiresAt && obj.expiresAt < Date.now()) {
      await fs.unlink(p).catch(() => {});
      return null;
    }
    return obj.value;
  } catch {
    return null;
  }
}

async function fileSet(key: string, value: string, ttl: number) {
  try {
    const dir = getFileCacheDir();
    await fs.mkdir(dir, { recursive: true });
    const p = path.join(dir, Buffer.from(key).toString("base64url") + ".json");
    await fs.writeFile(p, JSON.stringify({ value, expiresAt: Date.now() + ttl }), "utf-8");
  } catch {
    // 静默失败
  }
}

/** 通用缓存读取 (get-or-set) */
export async function cached<T>(key: string, loader: () => Promise<T>, ttl = CACHE_TTL_DEFAULT): Promise<T> {
  const c = await getClient();
  let hit: string | null = null;
  try {
    if ((c as any).type === "memory") hit = await fileGet(key);
    else hit = await (c as RedisClientType).get(key);
    if (hit) {
      try { return JSON.parse(hit) as T; } catch { /* fallthrough */ }
    }
  } catch { /* cache miss */ }
  const value = await loader();
  try {
    const str = JSON.stringify(value);
    if ((c as any).type === "memory") await fileSet(key, str, ttl);
    else await (c as RedisClientType).set(key, str, { EX: Math.floor(ttl / 1000) });
  } catch { /* ignore cache write error */ }
  return value;
}

/** 失效某类缓存 (按前缀) */
export async function invalidate(prefix: string) {
  const c = await getClient();
  if ((c as any).type === "memory") {
    for (const k of _memCache.keys()) {
      if (k.startsWith(prefix)) _memCache.delete(k);
    }
    return;
  }
  try {
    for await (const k of (c as RedisClientType).scanIterator({ MATCH: prefix + "*", COUNT: 100 })) {
      await (c as RedisClientType).del(k);
    }
  } catch { /* ignore */ }
}

/** 整体清空 */
export async function cacheFlush() {
  const c = await getClient();
  if ((c as any).type === "memory") {
    _memCache.clear();
    return;
  }
  try { await (c as RedisClientType).flushDb(); } catch {}
  try { await (c as RedisClientType).flushAll(); } catch {}
}
