import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { toast } from 'vue3-toastify';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'a2urbex',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          if (!response || response.status !== 200) {
            toast.error('You are offline!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
          }
          return response;
        },
      },
    ],
  })
);