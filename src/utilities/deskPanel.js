// Ordinateur : la carte reste au centre et les pages s'ouvrent dans un panneau à droite.
// Pas sur mobile, ni pour l'accueil et l'admin (pages larges, sans carte), ni pour Locations
// (carte ou liste en plein écran, via la bascule de la barre latérale).
export const desktopQuery = window.matchMedia('(min-width: 990px)');
export const isDeskPanel = (path, loggedIn) => desktopQuery.matches && loggedIn && path !== '/' && path !== '/locations' && !path.startsWith('/admin');
