const CACHE_NAME = "cleancare-v5";
const STATIC_CACHE = "cleancare-static-v5";
const urlsToCache = [
  "/",
  "/manifest.json?v=20250112",
  "/icons/icon-72x72-20250112.png",
  "/icons/icon-96x96-20250112.png",
  "/icons/icon-128x128-20250112.png",
  "/icons/icon-144x144-20250112.png",
  "/icons/icon-152x152-20250112.png",
  "/icons/icon-192x192-20250112.png",
  "/icons/icon-384x384-20250112.png",
  "/icons/icon-512x512-20250112.png",
];

// Install service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing v5...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Service Worker: Caching app shell");
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting(); // Force the waiting service worker to become active
});

// Activate service worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating v5...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim(); // Take control of all pages
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip chrome-extension requests and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Don't interfere with API requests at all - let them pass through normally
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("onrender.com") ||
    event.request.url.includes("localhost:3001") ||
    event.request.url.includes("cleancarepro") ||
    event.request.method !== "GET"
  ) {
    // Let these requests pass through without any service worker intervention
    return;
  }

  // BYPASS CACHE for HTML files, manifest, and service worker
  if (
    event.request.url.match(/\.(html)$/) ||
    event.request.url.includes("manifest.json") ||
    event.request.url.includes("sw.js") ||
    event.request.url.endsWith("/") // Root requests
  ) {
    // Force network fetch with cache-busting headers
    event.respondWith(
      fetch(event.request, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      }).catch(() => {
        // Fallback to cached index.html only if network fails
        return caches.match("/").then((indexResponse) => {
          return (
            indexResponse ||
            new Response("Page not available offline", {
              status: 503,
              statusText: "Service Unavailable",
            })
          );
        });
      }),
    );
    return;
  }

  // Handle static assets with caching (but not HTML)
  if (
    event.request.url.includes("/assets/") ||
    event.request.url.includes("/static/") ||
    event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Cache successful responses for static assets
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return new Response("Asset not available offline", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });
      }),
    );
    return;
  }

  // Handle other navigation requests - always fetch from network first
  event.respondWith(
    fetch(event.request, {
      cache: "no-cache",
    }).catch(() => {
      // Only use cache as fallback if network fails
      return caches.match("/").then((indexResponse) => {
        return (
          indexResponse ||
          new Response("Page not available offline", {
            status: 503,
            statusText: "Service Unavailable",
          })
        );
      });
    }),
  );
});

// Push event handler
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  const options = {
    body: event.data
      ? event.data.text()
      : "New notification from CleanCare Pro",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "view",
        title: "View Details",
        icon: "/icons/icon-72x72.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-72x72.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("CleanCare Pro", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.");

  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync tasks
  return Promise.resolve();
}
