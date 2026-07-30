const CACHE_NAME = 'riane-portfolio-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
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
