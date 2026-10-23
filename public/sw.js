/**
 * Service Worker pour Backgammon Tournament & Grand-Maître Coach (PWA).
 *
 * Fonctionnalités :
 * - Mise en cache de l'App Shell hors-ligne (pages, manifest, icônes).
 * - Stratégie Network-First avec repli sur cache et page offline pour la navigation.
 * - Stratégie Cache-First pour les assets statiques immuables (_next/static, SVG, icônes).
 * - Repli gracieux pour les appels API en cas de coupure réseau.
 *
 * VERSIONING :
 * - `CACHE_VERSION` doit être incrémenté à chaque déploiement pour forcer
 *   l'invalidation du cache et éviter de servir des versions périmées de l'app.
 * - À l'activation, les anciens caches sont purgés et les onglets ouverts sont
 *   rechargés automatiquement (`clients.claim()` + notification de rechargement).
 */

const CACHE_VERSION = 'v5';
const CACHE_NAME = `backgammon-pwa-${CACHE_VERSION}`;
const IS_LOCALHOST =
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1';

const STATIC_PRECACHE = [
    '/',
    '/progression',
    '/drills',
    '/puzzles',
    '/history',
    '/manifest.json',
    '/offline.html',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
    '/engine/wildbg.wasm',
    '/data/bearoff.bin',
    '/wasm/wildbg_wasm_bg.wasm',
];

// Installation : pré-mise en cache des ressources critiques et du moteur WASM (non-bloquante).
// Chaque ressource est mise en cache individuellement pour éviter qu'un échec
// isolé ne fasse échouer toute l'installation.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                STATIC_PRECACHE.map((url) => cache.add(url)),
            );
        }).then(() => self.skipWaiting())
    );
});

// Activation : purge des anciens caches puis prise de contrôle immédiate des onglets.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => IS_LOCALHOST || name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Gestion des messages du client (SKIP_WAITING et PREWARM_ASSETS pour le cache WASM/offline)
self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data.type === 'PREWARM_ASSETS' && Array.isArray(event.data.urls)) {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) =>
                Promise.allSettled(event.data.urls.map((u) => cache.add(u)))
            )
        );
    }
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes cross-origin ou le développement local (évite de servir des bundles JS/CSS périmés)
    if (url.origin !== self.location.origin || IS_LOCALHOST) {
        return;
    }

    // 1. API Routes (GET & POST /api/evaluate, /api/coach, etc.) :
    //    Network-First avec repli JSON instantané en mode hors-ligne pour activer
    //    sans délai le moteur local WildBG WASM + Coach déterministe.
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({
                        error: 'offline',
                        offlineFallback: true,
                        engine: 'local-wildbg-wasm',
                        message: 'Mode Hors-Ligne actif : évaluation assurée par le moteur local WildBG WASM.',
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

    // Ne pas intercepter les autres requêtes non-GET
    if (request.method !== 'GET') {
        return;
    }

    // 2. Navigation HTML (Pages) : Network-First strict avec repli Cache puis App Shell ('/') ou page Offline.
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
                    const appShell = await caches.match('/');
                    if (appShell) {
                        return appShell;
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

    // 3. Binaires WASM (/wasm/*.wasm), Assets Next.js (_next/static), icônes & textures SVG :
    //    Stratégie Cache-First pour garantir une exécution 100 % hors-ligne à 60 FPS.
    const isImmutableOrWasm =
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/wasm/') ||
        url.pathname.endsWith('.wasm') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.woff2');

    if (isImmutableOrWasm) {
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

    // 4. Par défaut : Network-First avec mise en cache et repli hors-ligne.
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return networkResponse;
            })
            .catch(() => caches.match(request))
    );
});
