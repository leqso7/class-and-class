const CACHE_NAME = 'student-selector-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icon-192x192.png',
  './icon-512x512.png',
  './manifest.json'
];

// Service Worker-ის ინსტალაცია
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// ქეშის აქტივაცია და ძველი ქეშის წაშლა
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ქეშიდან მოთხოვნების დამუშავება
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return a fallback response for offline access
            return new Response('ოფლაინ რეჟიმი', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});// sw.js ფაილში დავამატოთ მეტი logging
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: ინსტალაცია დაიწყო');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: ქეშის შექმნა დაიწყო');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker: ყველა ფაილი წარმატებით დაქეშირდა');
      })
      .catch((error) => {
        console.error('❌ Service Worker: ქეშირების შეცდომა:', error);
      })
  );
});
