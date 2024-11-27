const CACHE_NAME = 'school-app-v1';
const ASSETS = [
  '/class-and-class/',
  '/class-and-class/index.html',
  '/class-and-class/manifest.json',
  '/class-and-class/icon-192x192.png',
  '/class-and-class/icon-512x512.png',
  // დავამატოთ ყველა საჭირო რესურსი
];

// ინსტალაციისას ქეშირება
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// აქტივაციისას ძველი ქეშის წაშლა
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// მოთხოვნების დამუშავება
self.addEventListener('fetch', event => {
  // ვამოწმებთ არის თუ არა ადმინ პანელის მოთხოვნა
  if (event.request.url.includes('admin.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline mode - Admin panel not available'))
    );
    return;
  }

  // დანარჩენი მოთხოვნებისთვის
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // დაბრუნება ქეშიდან თუ არსებობს
        }

        // თუ არ არის ქეშში, ვცდილობთ ქსელიდან მიღებას
        return fetch(event.request)
          .then(networkResponse => {
            // ვინახავთ ქეშში
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          })
          .catch(() => {
            // თუ ქსელი არ არის და რესურსი არ არის ქეშში
            if (event.request.url.includes('index.html')) {
              return caches.match('/class-and-class/index.html');
            }
            // სხვა რესურსებისთვის ვაბრუნებთ ცარიელ პასუხს
            return new Response();
          });
      })
  );
});

// პერიოდული შემოწმება ადმინისტრატორის ბრძანებებისთვის
self.addEventListener('sync', event => {
  if (event.tag === 'check-admin-commands') {
    event.waitUntil(
      fetch('/admin-check')
        .then(response => response.json())
        .then(data => {
          if (data.blocked) {
            // თუ მომხმარებელი დაბლოკილია, ვშლით ქეშს
            return caches.delete(CACHE_NAME);
          }
        })
        .catch(() => {
          // თუ შემოწმება ვერ მოხერხდა, ვაგრძელებთ მუშაობას
          console.log('Admin check failed - continuing offline');
        })
    );
  }
});

// Service Worker-ის რეგისტრაცია
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/class-and-class/sw.js', {
            scope: '/class-and-class/'
        }).then(registration => {
            console.log('SW registered: ', registration);
        }).catch(error => {
            console.log('SW registration failed: ', error);
        });
    });
}

// მოდიფიცირებული fetch ჰენდლერი
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(
                    function(response) {
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(() => {
                    // თუ ქსელი არ არის ხელმისაწვდომი, ვაბრუნებთ ქეშირებულ ვერსიას
                    return caches.match('/class-and-class/index.html');
                });
            })
    );
});
