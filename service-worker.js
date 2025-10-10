// service-worker.js - caché básico para PWA offline
const CACHE_VERSION = 'novaflow-v1';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png'
  // añade aquí más imágenes estáticas: '/img/product_taco.jpg', etc.
];

// Instalación - cache inicial
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CACHE_FILES))
  );
});

// Activación - limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch - estrategia: cache-first for app shell, network fallback
self.addEventListener('fetch', event => {
  const req = event.request;
  // ignore non-GET
  if (req.method !== 'GET') return;

  // try cache first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // optionally cache responses for same-origin requests (images, css, js)
        if (req.url.startsWith(self.location.origin)) {
          const responseClone = res.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(req, responseClone).catch(()=>{});
          });
        }
        return res;
      }).catch(() => {
        // fallback to offline page or a small placeholder (optional)
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
