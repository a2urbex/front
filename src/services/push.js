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
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) }));
  await request('POST', '/push/subscribe', sub.toJSON());
  return true;
};

export const disablePush = async () => {
  if (!pushSupported()) return;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (!sub) return;
  await request('DELETE', '/push/subscribe', { endpoint: sub.endpoint });
  await sub.unsubscribe();
};
