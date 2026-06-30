// ML 学习站 Service Worker
// 策略:
//   1. 静态资源 (JS/CSS/Font/Image) -> Cache First, 缓存 30 天
//   2. 页面导航 (HTML) -> Network First, 失败 fallback 离线页
//   3. API (GET, /api/) -> Network First, 失败返回空 JSON
//   4. 其它 -> Network First

const CACHE_VERSION = "ml-site-v11.3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// 安装: 预缓存关键静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

// 激活: 清理旧版本缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 拦截 fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // 只缓存 GET
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 跨域不处理

  // 1. 静态资源: cache first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req)
            .then((res) => {
              if (res.ok) {
                const copy = res.clone();
                caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
              }
              return res;
            })
            .catch(() => cached)
      )
    );
    return;
  }

  // 2. 页面导航: network first
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("/offline"))
        )
    );
    return;
  }

  // 3. 章节下载 (md/text/html): network first, 失败 fallback
  if (url.pathname.startsWith("/api/chapter/export")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 3. API: network first, fallback 缓存
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname.startsWith("/api/search")) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 4. 其它: network first
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// 监听消息: 用于强制更新
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ========== v19.3 PUSH 通知支持 ==========
// 接收来自服务器的 push 消息, 显示系统通知
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "ML 学习站", body: event.data.text() };
  }
  const title = payload.title || "ML 学习站";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    image: payload.image,
    data: payload.data || {},
    tag: payload.tag || "ml-site-default",
    requireInteraction: payload.requireInteraction || false,
    actions: payload.actions || [
      { action: "open", title: "查看" },
      { action: "close", title: "关闭" },
    ],
    // 默认中文
    lang: "zh-CN",
    dir: "auto",
    vibrate: [200, 100, 200],
  };
  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.error("[sw] showNotification failed", err);
    })
  );
});

// 用户点击通知时, 打开/聚焦相关页面
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action;
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 优先聚焦已有窗口
      for (const client of clientList) {
        if ("focus" in client && "url" in client) {
          const u = new URL(client.url);
          // 同源
          if (u.origin === self.location.origin) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // 没有已开窗口, 新开
      return self.clients.openWindow(targetUrl);
    })
  );
});

// 推送订阅变化时 (例如用户重置权限), 通知客户端
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((c) =>
        c.postMessage({
          type: "push-subscription-change",
          oldEndpoint: event.oldSubscription?.endpoint,
          newEndpoint: event.newSubscription?.endpoint,
        })
      );
    })
  );
});
