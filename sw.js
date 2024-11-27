const CACHE_NAME = 'site-cache-v3';
const ASSETS = [
  '/class-and-class/',
  '/class-and-class/index.html',
  '/class-and-class/request.html',
  '/class-and-class/manifest.json',
  '/class-and-class/icon-192x192.png',
  '/class-and-class/icon-512x512.png',
  '/class-and-class/styles.css',
  '/class-and-class/scripts.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firebaseio.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('/class-and-class/index.html');
            }
          });
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(ASSETS);
        })
    );
  }
});
