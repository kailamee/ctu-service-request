// ============================================================
// SERVICE WORKER
// Caches the "app shell" (HTML, CSS, JS, icons) so the app
// can open even when there is no internet connection.
// Strategy: cache-first for app files.
// If you change any file, raise the version number below.
// ============================================================

const CACHE_NAME = "ctu-requests-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/app.js",
  "./js/config/statusConfig.js",
  "./js/config/concernTypes.js",
  "./js/data/dataService.js",
  "./js/services/requestService.js",
  "./js/ui/messages.js",
  "./js/ui/connectionBanner.js",
  "./js/ui/formView.js",
  "./js/ui/requestCard.js",
  "./js/ui/listView.js",
  "./js/ui/devPanel.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never cache the server API: requests must always go to the real server.
  if (url.pathname.includes("/api/")) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // keep a copy of other same-site files we fetched
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // offline and not cached: for page loads, show the cached app
          if (request.mode === "navigate") return caches.match("./index.html");
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
    })
  );
});
