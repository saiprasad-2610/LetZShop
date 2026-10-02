// ==============================================================================
// Simply E-Commerce: Buyer Storefront PWA Service Worker
// STRICT PRIVACY & ZERO CACHING OF SENSITIVE CHECKOUT / PAYMENT PAYLOADS
// ==============================================================================

const CACHE_NAME = 'simply-storefront-v1';
const STATIC_ASSETS = ['/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STRICT RULE: Never cache API calls, checkout submissions, payments, or cart mutations
  if (
    url.pathname.startsWith('/api/') ||
    event.request.method !== 'GET' ||
    url.pathname.includes('/checkout') ||
    url.pathname.includes('/order/')
  ) {
    return; // Pass through to network with zero caching
  }

  // Network-first strategy for dynamic storefront pages and static assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
