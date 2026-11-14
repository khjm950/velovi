
const CACHE_NAME = 'velovi-shell-v4';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './install.js',
  './icon-192.png',
  './icon-512.png'
];

const APP_FILES = new Set(
  APP_SHELL.map(path => new URL(path, self.registration.scope).href)
);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('velovi-shell-') && key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // لا نخزن طلبات المواقع الخارجية أو الخدمات البنكية.
  if (url.origin !== self.location.origin) return;

  // عند فتح صفحات التطبيق: الشبكة أولاً، ثم النسخة المحفوظة عند الانقطاع.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || Response.error();
      })
    );
    return;
  }

  // تخزين ملفات التطبيق المحددة فقط.
  if (!APP_FILES.has(url.href)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    })
  );
});
