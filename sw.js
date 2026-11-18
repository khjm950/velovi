'use strict';
const CACHE_NAME = 'velovi-shell-v22';
const APP_SHELL = ['./','./index.html','./styles.css','./app.js','./auth.js','./i18n.js','./supabase-config.js','./manifest.webmanifest','./install.js','./capacitor-bridge.js','./icon-192.png','./icon-512.png'];
const APP_FILES = new Set(APP_SHELL.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('velovi-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
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
