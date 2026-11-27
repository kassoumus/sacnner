// Service worker : met en cache l’application et OpenCV.js pour un usage hors ligne.
// Après une modification des fichiers, changez le numéro de version ci-dessous
// pour forcer la mise à jour sur le téléphone.
const CACHE = 'scanner-v7';
// Fichiers volumineux de l’OCR : conservés d’une version à l’autre pour ne pas les retélécharger.
const OCR_CACHE = 'scanner-ocr-v1';
const isOcr = (url) => url.pathname.includes('/ocr/') || url.hostname === 'cdn.jsdelivr.net';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== OCR_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache d’abord, réseau ensuite. Tout ce qui est téléchargé avec succès
// (dont opencv.js, la première fois) est gardé pour les prochaines ouvertures.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request)
        .then((res) => {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(isOcr(new URL(event.request.url)) ? OCR_CACHE : CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => Response.error());
    })
  );
});
