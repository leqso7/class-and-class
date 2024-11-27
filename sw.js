const CACHE_NAME = 'site-cache-v2';
const ASSETS = [
  '/class-and-class/',
  '/class-and-class/index.html',
  '/class-and-class/request.html',
  '/class-and-class/manifest.json',
  '/class-and-class/icon-192x192.png',
  '/class-and-class/icon-512x512.png',
  '/class-and-class/styles.css',
  '/class-and-class/scripts.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js'
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
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (event.request.url.includes('firebaseio.com')) {
              return response;
            }

            if (!response || response.status !== 200) {
              if (event.request.mode === 'navigate') {
                return caches.match('/class-and-class/index.html');
              }
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