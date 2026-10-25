import { ref } from 'vue';

// Disposition des cartes de points (réglage Appearance, par appareil) : 'staggered' (quinconce, défaut) ou 'grid'
const KEY = 'a2-card-layout';
const read = () => {
  try {
    return localStorage.getItem(KEY) === 'grid' ? 'grid' : 'staggered';
  } catch {
    return 'staggered';
  }
};
export const cardLayout = ref(read());
export const setCardLayout = (v) => {
  cardLayout.value = v === 'grid' ? 'grid' : 'staggered';
  try {
    localStorage.setItem(KEY, cardLayout.value);
  } catch {}
};
