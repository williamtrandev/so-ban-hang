const CACHE = "shop-shell-v4";
const OFFLINE_URL = "/offline.html";

// Tài nguyên có hash trong tên (JS/CSS/font của Next) hoặc ít đổi (icon, splash):
// lấy từ cache ngay, mở app lần sau không phải tải lại vài trăm KB qua mạng.
const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/splash/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Preload: trình duyệt gửi request trang song song lúc SW còn đang khởi
      // động, khỏi chờ SW boot xong mới bắt đầu tải.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    })(),
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    trim(cache);
  }
  return response;
}

// Mỗi lần deploy sinh file hash mới; giữ ~250 mục mới nhất là đủ cho bản đang chạy.
async function trim(cache) {
  const keys = await cache.keys();
  const extra = keys.length - 250;
  for (let i = 0; i < extra; i++) {
    if (!keys[i].url.endsWith(OFFLINE_URL)) await cache.delete(keys[i]);
  }
}

// Trang (HTML) luôn lấy mạng trước vì chứa dữ liệu đơn hàng, chỉ rơi về trang
// offline khi mất mạng. Không cache API/auth.
async function networkFirstPage(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    return (await caches.match(OFFLINE_URL)) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin && STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(cacheFirst(request));
  }
});
