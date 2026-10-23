// "Refresh App" : force la nouvelle version. Les suppressions sont attendues avant de recharger
// (sinon iOS recharge parfois l'ancienne version depuis le cache).
export const forceAppUpdate = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
      await Promise.all(regs.map((r) => r.unregister()));
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
