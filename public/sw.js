const CACHE = "wts-compoundiq-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then(ks =>
  Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return;
  // Never cache the API: subscription status must always be live (a cached answer would
  // freeze a buyer's plan as it was on their first visit).
  if (url.pathname.startsWith("/api/")) return;
  // Pages go network-first so a new deploy (new hashed JS/CSS filenames) is picked up
  // immediately; the cache is only the offline fallback. Hashed /assets/ files are immutable,
  // so those stay cache-first.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("/index.html", copy));
        return res;
      }).catch(() => caches.match("/index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match("/index.html")))
  );
});
