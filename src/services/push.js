import { request } from '@/services/api';

const toKey = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// Doit être appelé depuis un tap utilisateur (iOS 16.4+)
export const enablePush = async () => {
  if (!pushSupported()) return false;
  if ((await Notification.requestPermission()) !== 'granted') return false;

  const { key } = await request('GET', '/push/key');
  if (!key) throw new Error('Notifications are not configured on the server (VAPID keys missing).');

  const reg = await navigator.serviceWorker.ready;
  const appKey = toKey(key);
  let sub = await reg.pushManager.getSubscription();
  // abonnement créé avec d'anciennes clés VAPID : le navigateur le réutiliserait et plus rien n'arriverait
  if (sub && !sameKey(sub.options?.applicationServerKey, appKey)) {
    await sub.unsubscribe().catch(() => {});
    sub = null;
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
  await request('POST', '/push/subscribe', sub.toJSON());
  return true;
};

const sameKey = (a, b) => {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
};

// "Reset notifications" : supprime l'abonnement de l'appareil (navigateur + serveur), met à jour le
// service worker, puis réabonne proprement. Corrige un appareil qui ne reçoit plus rien.
export const resetPush = async () => {
  if (!pushSupported()) throw new Error('Notifications are not supported on this device.');
  const reg = await navigator.serviceWorker.ready;
  await reg.update().catch(() => {});
  const old = await reg.pushManager.getSubscription();
  if (old) {
    await request('DELETE', '/push/subscribe', { endpoint: old.endpoint }).catch(() => {});
    await old.unsubscribe().catch(() => {});
  }
  return enablePush();
};

export const disablePush = async () => {
  if (!pushSupported()) return;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (!sub) return;
  await request('DELETE', '/push/subscribe', { endpoint: sub.endpoint });
  await sub.unsubscribe();
};
