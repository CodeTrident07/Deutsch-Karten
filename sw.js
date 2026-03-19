// DeutschKarten Service Worker — Offline Cache
const CACHE = 'dk-v1';
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './spelling.html',
  './leaderboard.html',
  './derdiedas.html',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=JetBrains+Mono:wght@400;500&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for navigation, cache-first for assets
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./app.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
