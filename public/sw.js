/**
 * Service Worker pour Backgammon Tournament & Grand-Maître Coach (PWA).
 *
 * Fonctionnalités :
 * - Mise en cache de l'App Shell hors-ligne (pages, manifest, icônes).
 * - Stratégie Network-First avec repli sur cache et page offline pour la navigation.
 * - Stratégie Cache-First pour les assets statiques immuables (_next/static, SVG, icônes).
 * - Repli gracieux pour les appels API en cas de coupure réseau.
 */

const CACHE_NAME = 'backgammon-pwa-v1';

const STATIC_PRECACHE = [
    '/',
    '/progression',
    '/manifest.json',
    '/offline.html',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
];

// Installation : pré-mise en cache des ressources critiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_PRECACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activation : purge des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ne pas intercepter les requêtes non-GET ou cross-origin
    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // 1. Navigation HTML (Pages) : Network-First avec repli Cache puis page Offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    const offlinePage = await caches.match('/offline.html');
                    return offlinePage || new Response('Hors-ligne', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain' },
                    });
                })
        );
        return;
    }

    // 2. Assets statiques immuables (_next/static, icônes, images) : Cache-First
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 3. API Routes : Network-First avec repli JSON offline
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({
                        error: 'offline',
                        message: 'Appareil actuellement hors-ligne. Le mode dégradé local est actif.',
                    }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            })
        );
        return;
    }

    // 4. Par défaut : Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});

// Écoute du message SKIP_WAITING pour mise à jour immédiate
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
