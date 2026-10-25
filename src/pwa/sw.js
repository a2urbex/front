import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// autoUpdate : la nouvelle version s'active tout de suite au lieu d'attendre la fermeture de toutes les fenêtres
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Déclarés avant toute route : utilisés au niveau racine, un accès avant leur `const` fait planter
// l'évaluation du SW (ReferenceError) → il ne s'installe jamais et serviceWorker.ready ne résout pas.
const IMAGES = 'a2-images';
const okOnly = { cacheWillUpdate: async ({ response }) => (response && response.status === 200 ? response : null) };
// <img> cross-origin = réponse opaque (status 0)
const okOrOpaque = { cacheWillUpdate: async ({ response }) => (response && (response.status === 200 || response.type === 'opaque') ? response : null) };

// Navigations : réseau d'abord, AVANT le precache. Sinon le precache sert l'ancien index.html sur "/"
// (start_url de la PWA) et la 1re ouverture après un déploiement affiche l'ancienne version.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'a2urbex',
    networkTimeoutSeconds: 4,
    // hors-ligne et page jamais visitée : on retombe sur l'index.html précaché
    plugins: [okOnly, { handlerDidError: async () => (await matchPrecache('/index.html')) || Response.error() }],
  })
);

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Mode terrain : précharge les images de la liste active pour le hors-ligne
  if (event.data && event.data.type === 'CACHE_LIST') {
    const urls = (event.data.urls || []).filter(Boolean);
    event.waitUntil(
      caches.open(IMAGES).then((cache) =>
        Promise.all(urls.map((u) => cache.match(u).then((hit) => hit || fetch(u, { mode: 'no-cors' }).then((r) => cache.put(u, r)).catch(() => null)))),
      ),
    );
  }
});


// Liste active + fiches : réseau d'abord, cache si hors-ligne
registerRoute(
  ({ url, request }) => request.method === 'GET' && /\/(favorite|location)\/[0-9a-z]{24,}/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'a2-lists',
    networkTimeoutSeconds: 6,
    plugins: [okOnly, new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 14 * 24 * 3600 })],
  })
);

registerRoute(
  ({ url, request }) => request.destination === 'image' && url.pathname.startsWith('/img/locations/'),
  new CacheFirst({
    cacheName: IMAGES,
    plugins: [okOrOpaque, new ExpirationPlugin({ maxEntries: 1500, maxAgeSeconds: 30 * 24 * 3600, purgeOnQuotaError: true })],
  })
);

registerRoute(
  ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'a2-tiles',
    plugins: [okOrOpaque, new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: 14 * 24 * 3600, purgeOnQuotaError: true })],
  })
);

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { title: event.data?.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'a2urbex', {
      body: data.body || '',
      icon: '/logox192.png',
      badge: '/logox192.png',
      tag: data.channel,
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const win = list.find((c) => c.url.startsWith(self.location.origin));
      if (win) return win.navigate(url).then((c) => (c || win).focus());
      return self.clients.openWindow(url);
    }),
  );
});
