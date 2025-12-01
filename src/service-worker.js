const CACHE_NAME = 'ai-chat-v1';
const CORE_ASSETS = [
    '/',
    '/public/index.html',
    '/src/styles.css',
    '/src/app.js',
    '/src/core/modelLoader.js',
    '/src/core/chatEngine.js',
    '/src/core/personaEngine.js',
    '/src/core/quotaManager.js',
    '/src/core/memoryEngine.js',
    '/src/core/miniappBootstrap.js',
    '/src/ui/uiRenderer.js',
    '/src/ui/chatUI.js',
    '/src/ui/personaUI.js',
    '/src/ui/settingsUI.js',
    '/src/ui/modal.js',
    '/src/ui/themeManager.js',
    '/src/utils/storage.js',
    '/src/utils/events.js',
    '/src/utils/format.js',
    '/src/utils/fileExport.js'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.hostname.includes('esm.run') || 
        url.hostname.includes('cdn') ||
        url.hostname.includes('huggingface') ||
        url.hostname.includes('mlc.ai')) {
        
        event.respondWith(
            caches.open('external-libs')
                .then(cache => {
                    return cache.match(event.request)
                        .then(response => {
                            if (response) {
                                return response;
                            }
                            
                            return fetch(event.request)
                                .then(networkResponse => {
                                    if (networkResponse.ok) {
                                        cache.put(event.request, networkResponse.clone());
                                    }
                                    return networkResponse;
                                })
                                .catch(() => {
                                    return cache.match(event.request);
                                });
                        });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse.ok && event.request.method === 'GET') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    });
            })
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/public/index.html');
                }
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});