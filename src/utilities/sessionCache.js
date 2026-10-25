// Petit cache mémoire pour la durée de la session (vidé à la fermeture de l'app) :
// les pages affichent tout de suite les dernières données, puis les rafraîchissent en arrière-plan.
const store = new Map();
export const cached = (key) => store.get(key);
export const remember = (key, value) => {
  store.set(key, value);
  return value;
};
