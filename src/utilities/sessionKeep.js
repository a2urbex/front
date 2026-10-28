// iOS peut décharger la PWA en arrière-plan et la recharger au retour : on garde l'essentiel de la session
// pour que la carte revienne telle quelle (points déjà chargés, vue, « Load map » déjà fait).
// - petits états : sessionStorage (survit au rechargement, pas à la fermeture de l'app)
// - points de la carte : IndexedDB (plusieurs Mo)

export const keepGet = (key) => {
  try { return JSON.parse(sessionStorage.getItem(`a2:${key}`)); } catch { return null; }
};
export const keepSet = (key, value) => {
  try { sessionStorage.setItem(`a2:${key}`, JSON.stringify(value)); } catch {}
};

const DB = 'a2-keep', STORE = 'kv';
const open = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const run = async (mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
};
export const bigGet = (key) => run('readonly', (s) => s.get(key)).catch(() => null);
export const bigSet = (key, value) => run('readwrite', (s) => s.put(value, key)).catch(() => {});
