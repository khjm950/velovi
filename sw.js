'use strict';
const CACHE_NAME = 'velovi-shell-v23';
const LOCAL_APP_SHELL = [
  './','./index.html','./styles.css','./app.js','./auth.js','./i18n.js',
  './supabase-config.js','./manifest.webmanifest','./install.js',
  './capacitor-bridge.js','./icon-192.png','./icon-512.png'
];
const EXTERNAL_APP_SHELL = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0'
];
const APP_FILES = new Set([...LOCAL_APP_SHELL, ...EXTERNAL_APP_SHELL]
  .map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(async cache => {
      await cache.addAll(LOCAL_APP_SHELL);
      await Promise.all(EXTERNAL_APP_SHELL.map(url =>
        cache.add(url).catch(error => console.warn('Optional offline library cache failed:', url, error))
      ));
    })
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key.startsWith('velovi-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(async () => (await caches.open(CACHE_NAME)).match('./index.html') || Response.error()));
    return;
  }

  if (!APP_FILES.has(url.href)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(async () => (await caches.open(CACHE_NAME)).match(request) || Response.error()));
});
