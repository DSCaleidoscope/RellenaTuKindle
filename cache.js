const CACHE_NAME = 'imagenes-cache-v1';
const ASSETS_TO_CACHE = ["/img/ig_logo.png", "img/tt_logo.png", "img/placeholder.png", "style.css", "favicon.ico"];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|css|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {return cachedResponse;}

        return fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});