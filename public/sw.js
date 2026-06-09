// ML 学习站 Service Worker
// 策略:
//   1. 静态资源 (JS/CSS/Font/Image) -> Cache First, 缓存 30 天
//   2. 页面导航 (HTML) -> Network First, 失败 fallback 离线页
//   3. API (GET, /api/) -> Network First, 失败返回空 JSON
//   4. 其它 -> Network First

const CACHE_VERSION = "ml-site-v8.4";
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
