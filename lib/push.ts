/** Web Push (VAPID) 工具 — 生成 / 加载密钥, 推送消息 */
import webpush from "web-push";

const VAPID_KEYS_FILE = process.env.VAPID_KEYS_FILE || "/tmp/vapid-keys.json";

let initialized = false;
let cachedKeys: { publicKey: string; privateKey: string } | null = null;

function ensureInit() {
  if (initialized) return;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  let publicKey: string | undefined = process.env.VAPID_PUBLIC_KEY;
  let privateKey: string | undefined = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    // 尝试从文件读 (持久化, 服务重启不丢)
    try {
      const fs = require("fs") as typeof import("fs");
      if (fs.existsSync(VAPID_KEYS_FILE)) {
        const stored = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, "utf8"));
        publicKey = stored.publicKey;
        privateKey = stored.privateKey;
      } else {
        const k = webpush.generateVAPIDKeys();
        try {
          fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(k));
        } catch {
          /* ignore */
        }
        publicKey = k.publicKey;
        privateKey = k.privateKey;
      }
    } catch {
      // fallback — 内存中生成 (重启会变)
      const k = webpush.generateVAPIDKeys();
      publicKey = k.publicKey;
      privateKey = k.privateKey;
    }
  }
  webpush.setVapidDetails(subject, publicKey!, privateKey!);
  cachedKeys = { publicKey: publicKey!, privateKey: privateKey! };
  initialized = true;
}

export function getVapidPublicKey(): string {
  ensureInit();
  return cachedKeys!.publicKey;
}

/** 给指定订阅发送 push 消息, 返回 410 Gone 表示订阅已失效 */
export async function sendNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: object
): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  ensureInit();
  try {
    const res = await webpush.sendNotification(
      subscription as any,
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 } // 24h
    );
    return { ok: true, statusCode: res.statusCode };
  } catch (e: any) {
    const code = e?.statusCode;
    if (code === 404 || code === 410) {
      return { ok: false, statusCode: code, error: "subscription_gone" };
    }
    return { ok: false, statusCode: code, error: e?.message || "unknown" };
  }
}