const CACHE_STATIC = 'gimnasio-static-v2';
const CACHE_FONTS  = 'gimnasio-fonts-v1';

const STATIC_ASSETS = [
  '/gimnasio-mental/',
  '/gimnasio-mental/index.html',
  '/gimnasio-mental/manifest.json',
  '/gimnasio-mental/icon-192.png',
  '/gimnasio-mental/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_STATIC && k !== CACHE_FONTS)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_FONTS).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(response => {
            cache.put(e.request, response.clone());
            return response;
          }).catch(() => cached || new Response('', {status: 408}));
        })
      )
    );
    return;
  }

  if (url.includes('gimnasio-mental') || STATIC_ASSETS.some(a => url.endsWith(a))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          caches.open(CACHE_STATIC).then(c => c.put(e.request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
