const CACHE_NAME = 'categories-game-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/categories.html',
    '/show-answer.html',
    '/css/styles.css',
    '/css/questions.css',
    '/catpic/sports.png',
    '/catpic/history.png',
    '/catpic/science.png',
    '/catpic/geography.png',
    '/catpic/arts.png',
    '/catpic/islamic.png',
    '/catpic/tech.png',
    '/catpic/football.png',
    '/catpic/rulers.png',
    '/catpic/default.png',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('تم فتح الكاش');
                return cache.addAll(urlsToCache);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// استراتيجية الكاش
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
    );
}); 