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

    // Never cache API calls or WebSocket upgrades — always go to network
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws-chat')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For everything else: try network first, fall back to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and store successful responses in cache
                if (response && response.status === 200) {
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
