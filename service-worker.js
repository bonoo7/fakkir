const CACHE_NAME = 'fakkir-game-v1';
const BASE_URL = 'https://bonoo7.github.io/fakkir';

const urlsToCache = [
    `${BASE_URL}/`,
    `${BASE_URL}/index.html`,
    `${BASE_URL}/categories.html`,
    `${BASE_URL}/questions.html`,
    `${BASE_URL}/show-answer.html`,
    `${BASE_URL}/winner.html`,
    `${BASE_URL}/css/styles.css`,
    `${BASE_URL}/css/questions.css`,
    `${BASE_URL}/css/auth.css`,
    `${BASE_URL}/js/auth.js`,
    `${BASE_URL}/js/index.js`,
    `${BASE_URL}/js/questions.js`,
    `${BASE_URL}/catpic/sports.png`,
    `${BASE_URL}/catpic/history.png`,
    `${BASE_URL}/catpic/science.png`,
    `${BASE_URL}/catpic/geography.png`,
    `${BASE_URL}/catpic/arts.png`,
    `${BASE_URL}/catpic/islamic.png`,
    `${BASE_URL}/catpic/tech.png`,
    `${BASE_URL}/catpic/football.png`,
    `${BASE_URL}/catpic/rulers.png`,
    `${BASE_URL}/catpic/default.png`,
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('تم فتح الكاش');
                return cache.addAll(urlsToCache);
            })
    );
});

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
            .catch(() => {
                // إذا فشل الاتصال، نعرض صفحة الوضع غير المتصل
                if (event.request.mode === 'navigate') {
                    return caches.match(`${BASE_URL}/offline.html`);
                }
            })
    );
});

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