// URL d'image renvoyée par l'API : chemin relatif => préfixe API ; URL absolue ou data: (démo) => telle quelle
export const apiImage = (path) => {
  if (!path) return '';
  if (/^(data:|https?:|blob:)/.test(path)) return path;
  return `${import.meta.env.VITE_API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
