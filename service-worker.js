self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("ponto-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./app.js"
      ]);
    })
  );
});
