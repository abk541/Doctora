const CACHE_NAME = "doctora-cache-v7";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./data/courses.json",
  "./data/qcm_concours_medical_difficulties.json",
  "./data/medical_prompts.json",
  "./assets/brand/hamster.png",
  "./content/cours/anatomie_2018.pdf",
  "./content/cours/anatomie_schema.pdf",
  "./content/cours/biologie_2018.pdf",
  "./content/cours/chirurgicale_2018.pdf",
  "./content/cours/medicale_2018.pdf",
  "./content/cours/qe_residanat_classees.pdf",
  "./content/cours/qe_residanat_internat.pdf",
  "./content/cours/urgences_2018.pdf"
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
