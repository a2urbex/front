// Classes sur <body> pilotées par les composants (compteur : plusieurs instances possibles).
// Remplace les sélecteurs :has(), qu'iOS Safari ne recalcule pas toujours après un changement de page.
const counts = new Map();

export const addBodyClass = (name) => {
  counts.set(name, (counts.get(name) || 0) + 1);
  document.body.classList.add(name);
};

export const removeBodyClass = (name) => {
  const n = (counts.get(name) || 1) - 1;
  counts.set(name, n);
  if (n <= 0) document.body.classList.remove(name);
};
