// Bump this to force a fresh SW install after deploy.
const CACHE_NAME = 'hobbybuddy-v3';

// Only cache truly static assets that never change between deploys.
// Do NOT cache index.html — it's fetched network-first every time.
const urlsToCache = [
  '/favicon.svg',
  '/images/icon-192.png',
  '/images/icon-512.png',
];

// Install: cache static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate: delete old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML navigations, cache-first for hashed static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API calls or WebSocket upgrades
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws-')) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for HTML navigations — always get fresh index.html from server
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for versioned/hashed static assets (JS, CSS) — these have
  // unique filenames per deploy so stale copies are never a problem.
  // Skip cache-first for unversioned paths that might change (e.g. /version.json).
  if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: go to network (version.json, manifest.json, etc.)
  event.respondWith(fetch(request));
});
