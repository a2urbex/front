// Couleur d'accent choisie dans Profil (par appareil), orange par défaut.
// --tint : teinte ; --on-tint : texte lisible posé dessus.
export const ACCENTS = [
  { key: 'orange', label: 'Orange', tint: '#ff9f0a', on: '#000000' },
  { key: 'yellow', label: 'Yellow', tint: '#ffd60a', on: '#000000' },
  { key: 'green', label: 'Green', tint: '#30d158', on: '#000000' },
  { key: 'cyan', label: 'Cyan', tint: '#64d2ff', on: '#000000' },
  { key: 'indigo', label: 'Indigo', tint: '#7d7aff', on: '#ffffff' },
];
const KEY = 'a2-accent';

export const getAccent = () => {
  try {
    return ACCENTS.find((a) => a.key === localStorage.getItem(KEY)) || ACCENTS[0];
  } catch {
    return ACCENTS[0];
  }
};

export const applyAccent = (accent = getAccent()) => {
  const root = document.documentElement.style;
  root.setProperty('--tint', accent.tint);
  root.setProperty('--on-tint', accent.on);
};

export const setAccent = (key) => {
  const accent = ACCENTS.find((a) => a.key === key) || ACCENTS[0];
  try {
    localStorage.setItem(KEY, accent.key);
  } catch {}
  applyAccent(accent);
  return accent;
};
