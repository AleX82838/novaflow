// =======================================
// NOVAFLOW - Service Worker v2 (Offline)
// =======================================

const CACHE_NAME = 'novaflow-cache-v2';
const OFFLINE_URL = '/offline.html';

// Archivos que se guardan en caché
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  '/img/icons/icon-192.png',
  '/img/icons/icon-512.png'
];

// Instala el Service Worker
self.addEventListener('install', event => {
  console.log('📦 Instalando NOVAFLOW SW...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activa y limpia versiones antiguas
self.addEventListener('activate', event => {
  console.log('✅ Activando Service Worker NOVAFLOW...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// Intercepta peticiones y sirve desde caché (modo offline completo)
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return (
          response ||
          fetch(event.request).then(networkResp => {
            // Guarda en caché dinámicamente nuevos recursos
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResp.clone());
              return networkResp;
            });
          })
        );
      })
    );
  }
});
