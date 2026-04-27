const CACHE_VERSION = "bodypilot-v6";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/app-icon.svg",
  "/privacy.html",
  "/privacy-choices.html",
  "/terms.html",
  "/support.html",
];

const shouldIgnoreRequest = (url) =>
  url.pathname.startsWith("/@vite") ||
  url.pathname.startsWith("/src/") ||
  url.pathname.includes("/node_modules/");

const shouldCacheRequest = (request, url) =>
  request.mode === "navigate" ||
  APP_SHELL.includes(url.pathname) ||
  url.pathname.startsWith("/assets/") ||
  ["font", "image", "script", "style", "worker"].includes(request.destination);

const putInCache = async (request, response) => {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response.clone());
};

const networkFirst = async (request, fallbackKey) => {
  try {
    const response = await fetch(request);
    await putInCache(fallbackKey || request, response);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackKey) {
      const fallback = await caches.match(fallbackKey);
      if (fallback) return fallback;
    }
    throw error;
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldIgnoreRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }

  if (!shouldCacheRequest(request, url)) return;

  event.respondWith(
    networkFirst(request).catch(() => Response.error())
  );
});
