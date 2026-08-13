const CACHE_NAME = 'riane-portfolio-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always go network first with no caching of HTML/JS
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'RIANE Portfolio', body: 'Alerte Portefeuille' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/globe.svg',
      badge: '/globe.svg',
    })
  );
});
