// NodeOS Service Worker — offline-first PWA
const CACHE = 'nodeos-v1';
const SHELL = [
  '/',
  '/voice',
  '/onboarding',
  '/company',
  '/dashboard',
  '/widgets',
  '/marketplace',
  '/install',
  '/device',
  '/services',
  '/manifest.json',
  '/nodeos-icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))
        .catch(() => {})) // gracefully skip if any URL 404s in dev
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API proxy calls (/api/backend/*): network-first, offline fallback — never cache
  if (url.pathname.startsWith('/api/backend/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ offline: true, error: 'No network connection' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Next.js HMR / dev: always network
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.startsWith('/__nextjs')) {
    return;
  }

  // Static Next.js assets: cache-first
  if (url.pathname.startsWith('/_next/static')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // App pages: stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => null);
      return cached ?? network ?? new Response('Offline — NodeOS is running without internet. Cached data shown.', {
        status: 503, headers: { 'Content-Type': 'text/plain' },
      });
    })
  );
});

// Background sync: retry failed API calls when back online
self.addEventListener('sync', (e) => {
  if (e.tag === 'nodeos-sync') {
    e.waitUntil(
      self.clients.matchAll().then((clients) =>
        clients.forEach((c) => c.postMessage({ type: 'SYNC_NOW' }))
      )
    );
  }
});
