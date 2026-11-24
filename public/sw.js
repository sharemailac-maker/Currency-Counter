const CACHE_NAME = 'currency-counter-v4';

const PRECACHE_ASSETS = [
  '/app-icon.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API endpoints or Vite dev server module URLs
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname === '/ads.txt' ||
    url.pathname === '/sw.js'
  ) {
    return;
  }

  // Network-First for HTML/navigation so users never get stuck with stale index.html chunk hashes
  if (
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // Immutable content-hashed Vite bundles: pure Cache-First (zero background server hit once cached)
  const isImmutableHashedAsset =
    url.pathname.startsWith('/assets/c-') ||
    url.pathname.startsWith('/assets/e-') ||
    url.pathname.startsWith('/assets/a-') ||
    /\/assets\/.*-[A-Za-z0-9_-]{6,}\.(js|css|woff2?|png|svg|jpg|webp)$/.test(url.pathname);

  // Stale-While-Revalidate for unhashed assets; Cache-First for immutable hashed bundles
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        if (!isImmutableHashedAsset) {
          fetch(request)
            .then((networkResponse) => {
              const contentType = networkResponse.headers.get('content-type') || '';
              if (
                networkResponse &&
                networkResponse.ok &&
                networkResponse.type === 'basic' &&
                !(url.pathname.startsWith('/assets/') && contentType.includes('text/html'))
              ) {
                const copy = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        const contentType = networkResponse.headers.get('content-type') || '';
        if (
          !networkResponse ||
          !networkResponse.ok ||
          networkResponse.type !== 'basic' ||
          (url.pathname.startsWith('/assets/') && contentType.includes('text/html'))
        ) {
          return networkResponse;
        }

        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return networkResponse;
      });
    })
  );
});
