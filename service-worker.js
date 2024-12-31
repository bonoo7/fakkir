const CACHE_NAME = 'fakkir-game-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// الملفات الأساسية للتطبيق
const CORE_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/index.js',
    './manifest.json'
];

// الملفات الثانوية
const SECONDARY_ASSETS = [
    './categories.html',
    './questions.html',
    './show-answer.html',
    './css/questions.css'
];

// التثبيت - تخزين الملفات الأساسية فقط
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(CORE_ASSETS))
    );
});

// التنشيط - حذف الكاش القديم
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// استراتيجية التخزين المؤقت أولاً، ثم الشبكة
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // تحديث الكاش في الخلفية
                    fetch(event.request)
                        .then(response => {
                            if (response.ok) {
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => cache.put(event.request, response));
                            }
                        });
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// تحديث الكاش في الخلفية
self.addEventListener('sync', event => {
    if (event.tag === 'update-cache') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => {
                    return cache.addAll(SECONDARY_ASSETS);
                })
        );
    }
}); 