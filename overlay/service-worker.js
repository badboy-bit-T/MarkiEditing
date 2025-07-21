const CACHE_NAME = "patroli-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style1.css",
  "/js/script.js",
  "/js/html2canvas.min.js",
  "/js/jquery-3.7.1.min.js",
  "/js/FileSaver.min.js",
  "/img/water_icon_anchor.png",
  "/img/water_icon_coordinate.png",
  "/img/water_icon_handler.png",
  "/img/water_icon_validated.png",
  "/img/water_security1_subject_bg.png",
  "/img/water_security_patrol_bg.png",
  "/img/web-app-manifest-512x512.png", 
  "/img/web-app-manifest-192x192.png", 
  "/img/site.webmanifest", 
  "/img/apple-touch-icon.png", 
  "/img/favicon-96x96.png", 
  "/img/favicon.ico", 
  "/img/favicon.svg", 
  "/font/BloggersansBold.ttf"
];

// Install event
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Agar langsung aktif
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});