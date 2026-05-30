const CACHE_NAME = "shadowshield-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/base.css",
  "./css/components.css",
  "./css/landing.css",
  "./css/dashboard.css",
  "./css/portal.css",
  "./css/blockchain.css",
  "./css/admin.css",
  "./css/login.css",
  "./js/app.js",
  "./js/cctv.js",
  "./js/threat.js",
  "./js/blockchain.js",
  "./js/portal.js",
  "./js/admin.js",
  "./js/voice.js",
  "./js/login.js",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching Dashboard assets...");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Dropping old cache key:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interceptor Caching
self.addEventListener("fetch", (e) => {
  // Bypassing cache-first on development localhost to prevent stale pages
  if (e.request.url.includes("localhost") || e.request.url.includes("127.0.0.1")) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => {
        // Fallback for static assets in case fetch fails and it's not cached
        console.warn("[Service Worker] Resource offline fetch failure:", e.request.url);
      });
    })
  );
});
