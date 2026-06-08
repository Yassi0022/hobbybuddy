const CACHE_NAME = 'hobbybuddy-v2';
const NAVIGATION_PATHS = ['/login', '/register', '/dashboard', '/discover', '/profile', '/messages', '/verify', '/quiz', '/events'];
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/images/icon-192.png',
  '/images/icon-512.png',
];

// Install: cache core app shell only (not index.html content, just the URL)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  // Force the new service worker to activate immediately
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch: network-first for navigations (HTML), cache-first for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache API calls — always go to network
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  const isNavigation = request.mode === 'navigate'
    || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));

  if (isNavigation) {
    // Network-first for HTML — always get fresh index.html
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a fresh copy for offline fallback
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback to cached index.html
          return caches.match('/index.html').then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Cache new static assets
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
