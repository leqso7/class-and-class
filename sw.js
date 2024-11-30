const CACHE_NAME = 'site-cache-v1';
const ASSETS = [
    '/class-and-class/',
    '/class-and-class/index.html',
    '/class-and-class/request.html',
    '/class-and-class/manifest.json',
    '/class-and-class/icon-192x192.png',
    '/class-and-class/icon-512x512.png'
];

// Service Worker-ის ინსტალაცია
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('ქეშის გახსნა');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('რესურსები დაქეშილია');
                return self.skipWaiting();
            })
    );
});

// აქტივაციის დროს ძველი ქეშის წაშლა
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('ძ��ელი ქეშის წაშლა:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker აქტიურია');
            return self.clients.claim();
        })
    );
});

// fetch მოთხოვნების დამუშავება
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // დაბრუნება ქეშიდან თუ არსებობს
                if (response) {
                    return response;
                }
                // თუ არ არის ქეშში, მოთხოვნა სერვერზე
                return fetch(event.request)
                    .then(response => {
                        // შემოწმება არის თუ არა მოთხოვნა წარმატებული
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // ქეშირება
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
            .catch(() => {
                // ოფლაინ რეჟიმში დაბრუნება
                return new Response('ოფლაინ რეჟიმი', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});

// push ნოტიფიკაციების დამუშავება
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/class-and-class/icon-192x192.png',
        badge: '/class-and-class/icon-192x192.png'
    };

    event.waitUntil(
        self.registration.showNotification('შეტყობინება', options)
    );
});

// ნოტიფიკაციაზე დაკლიკების დამუშავება
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/class-and-class/')
    );
});
