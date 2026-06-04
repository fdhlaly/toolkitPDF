const CACHE_NAME = "toolkitpdf-v4";

const APP_SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
];

const PDF_RUNTIME_ASSETS = ["/wasm/qpdf.wasm"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled([
        ...APP_SHELL.map((url) => cache.add(url)),
        ...PDF_RUNTIME_ASSETS.map((url) => cache.add(url)),
      ]);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Jangan cache API dan file PDF user.
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.endsWith(".pdf")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url) || isPdfRuntimeAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

function isPdfRuntimeAsset(url) {
  return (
    url.pathname.startsWith("/wasm/") ||
    url.pathname.startsWith("/workers/") ||
    url.pathname.endsWith(".wasm") ||
    url.pathname.endsWith(".worker.js")
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    await cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    const offlineResponse = await cache.match("/offline.html");

    return cachedResponse || offlineResponse;
  }
}
