// Service worker của ví nóng: chỉ lưu sẵn chính ứng dụng để mở nhanh/ngoại tuyến.
// Không bao giờ lưu hay can thiệp vào dữ liệu từ máy chủ Cardano.
const CACHE = 'vi-nong-35f8a31bb712';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // API đi thẳng ra mạng
  // Ưu tiên bản mới nhất trên mạng (để bản cập nhật có hiệu lực ngay); mất mạng thì dùng bản đã lưu.
  e.respondWith((async () => {
    try {
      const fresh = await fetch(e.request, { cache: 'no-cache' });
      if (fresh && fresh.ok) { const c = await caches.open(CACHE); c.put(e.request, fresh.clone()); }
      return fresh;
    } catch {
      const hit = await caches.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw new Error('offline');
    }
  })());
});
