// Service worker của ví nóng: chỉ lưu sẵn chính ứng dụng để mở nhanh/ngoại tuyến.
// Không bao giờ lưu hay can thiệp vào dữ liệu từ máy chủ Cardano.
const CACHE = 'vi-nong-52ff59e50df8';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

const shellUrls = new Set(SHELL.map(file => new URL(file, self.registration.scope).href));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('vi-nong-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || !shellUrls.has(url.href)) return; // API đi thẳng ra mạng
  // Ưu tiên bản mới nhất trên mạng (để bản cập nhật có hiệu lực ngay); mất mạng thì dùng bản đã lưu.
  e.respondWith((async () => {
    try {
      const fresh = await fetch(e.request, { cache: 'no-cache' });
      if (fresh && fresh.ok && !fresh.redirected) { const c = await caches.open(CACHE); await c.put(e.request, fresh.clone()); }
      return fresh;
    } catch {
      const hit = await (await caches.open(CACHE)).match(e.request);
      if (hit) return hit;
      throw new Error('offline');
    }
  })());
});
