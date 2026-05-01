const CACHE_NAME = "doctora-cache-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./data/medical_prompts.json",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.svg",
  "./assets/stickers/whatsapp_reaction_01.jpg",
  "./assets/stickers/whatsapp_reaction_02.jpg",
  "./assets/stickers/whatsapp_reaction_03.jpg",
  "./assets/stickers/whatsapp_reaction_04.jpg",
  "./assets/stickers/whatsapp_reaction_05.jpg",
  "./assets/stickers/whatsapp_reaction_06.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
