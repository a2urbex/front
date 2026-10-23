// "Refresh App" : force la nouvelle version SANS désinscrire le service worker
// (le désinscrire supprime l'abonnement push de l'appareil : plus aucune notification).
export const forceAppUpdate = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
      regs.forEach((r) => r.waiting?.postMessage({ type: 'SKIP_WAITING' }));
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString(36));
    window.location.replace(url.toString());
  }
};
