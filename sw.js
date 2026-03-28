// DeutschKarten Service Worker — Full Offline Cache
// Version bump forces old caches to be replaced
const CACHE_NAME = 'dk-v4';

// All pages + critical assets to precache on install
const PRECACHE = [
  './',
  './app.html',
  './index.html',
  './login.html',
  './leaderboard.html',
  './spelling.html',
  './derdiedas.html',
  './sprint.html',
  './wordle.html',
  './phrases.html',
  './praepositionen.html',
  './starke-verben.html',
  './deutschkarten.html',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
];

// ── Install: precache everything ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Precache failed (some resources may be unavailable offline):', err);
        // Don't block install if some resources fail
        return self.skipWaiting();
      })
  );
});

// ── Activate: wipe old caches ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for assets, stale-while-revalidate for pages ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin (except Google Fonts)
  if (event.request.method !== 'GET') return;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!isFont && url.origin !== self.location.origin) return;

  // Fonts: cache-first (they never change)
  if (isFont) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          if (!resp || resp.status !== 200) return resp;
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        }).catch(() => cached);
      })
    );
    return;
  }

  // HTML pages: stale-while-revalidate
  // Serve from cache immediately, update in background
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then(resp => {
            if (resp && resp.status === 200) {
              cache.put(event.request, resp.clone());
            }
            return resp;
          })
          .catch(() => null);
        return cached || fetchPromise || caches.match('./app.html');
      })
    );
    return;
  }

  // Everything else: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return resp;
      }).catch(() => caches.match('./app.html'));
    })
  );
});
