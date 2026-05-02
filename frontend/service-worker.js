const CACHE_NAME = 'hobbybuddy-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/login',
    '/register',
    '/css/hobbybuddy.css',
    '/js/hobbybuddy.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: Network-first for API calls, Cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only cache GET requests. Never call cache.put() on POST, PUT, PATCH, DELETE.
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Exclude dynamic routes and auth-related requests from caching entirely
    if (
        url.pathname.startsWith('/api/') || 
        url.pathname.startsWith('/ws-chat') ||
        url.pathname === '/login' ||
        url.pathname === '/register' ||
        url.pathname === '/quiz/submit' ||
        url.pathname === '/dashboard' ||
        url.pathname === '/quiz'
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For static assets: try network first, fall back to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and store successful responses in cache
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(event.request);
            })
    );
});
