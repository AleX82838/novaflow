// NOVAFLOW v3 - Service Worker
const CACHE_NAME = 'novaflow-cache-v3';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  '/assets/intronivi.mp4',
  '/img/icons/icon-192.png',
  '/img/icons/icon-512.png'
];

self.addEventListener('install', event=>{
  event.waitUntil((async ()=>{
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(urlsToCache); } catch(e){ console.warn('SW: some assets failed to cache', e); }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event=>{
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event=>{
  if(event.request.method !== 'GET') return;
  if(event.request.mode === 'navigate'){
    event.respondWith((async ()=>{
      try { return await fetch(event.request); } catch(e){ const cache = await caches.open(CACHE_NAME); return await cache.match(OFFLINE_URL); }
    })());
    return;
  }
  event.respondWith((async ()=>{
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if(cached) return cached;
    try {
      const resp = await fetch(event.request);
      if(resp && resp.status === 200) cache.put(event.request, resp.clone());
      return resp;
    } catch(e){ return cached || (await cache.match(OFFLINE_URL)); }
  })());
});
