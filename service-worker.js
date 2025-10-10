// ==============================
// ⚙️ NOVAFLOW - Service Worker
// ==============================

const CACHE_NAME = 'novaflow-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/img/icons/icon-192.png',
  '/img/icons/icon-512.png'
];

// Instala el Service Worker y guarda en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Archivos en caché');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activa y limpia cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  console.log('✅ Service Worker activo');
});

// Intercepta solicitudes y sirve desde caché
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});
