const CACHE_NAME = "doctora-cache-v8";
const CORE_ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./data/qcm.json", "./data/courses.json", "./assets/brand/hamster.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const put = (request, response) => {
  if (response && response.status === 200 && response.type !== "opaque") {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (/\/(anniversaire|jeux|nous|labo|nous-deux|dico|annee|temps|blagues|bucket|maison|quiz|clinique|shared)\//.test(url.pathname)) return;

  // PDF et images : cache d'abord (lourds, ne changent pas)
  if (/\.(pdf|png|jpe?g|svg|webp)$/i.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((r) => put(request, r))));
    return;
  }
  // HTML, JS, CSS, JSON : réseau d'abord pour toujours avoir la dernière version, cache si hors ligne
  event.respondWith(
    fetch(request).then((r) => put(request, r)).catch(() => caches.match(request, { ignoreSearch: true }).then((c) => c || caches.match("./index.html")))
  );
});
