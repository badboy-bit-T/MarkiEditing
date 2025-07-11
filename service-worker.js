const CACHE_NAME = "patroli-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style1.css",
  "/js/script.js",
  "/img/water_icon_anchor.png",
  "/img/water_icon_coordinate.png",
  "/img/water_icon_handler.png",
  "/img/water_icon_validated.png",
  "/img/water_security1_subject_bg.png",
  "/img/water_security_patrol_bg.png",
  "/font/BloggersansBold.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});