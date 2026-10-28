// Ordinateur : la carte reste au centre et les pages s'ouvrent dans un panneau à droite.
// Pas sur mobile, ni pour l'accueil, ni pour Locations
// (carte ou liste en plein écran, via la bascule de la barre latérale).
export const desktopQuery = window.matchMedia('(min-width: 990px)');
export const isDeskPanel = (path, loggedIn) => desktopQuery.matches && loggedIn && path !== '/' && path !== '/locations' && !path.startsWith('/location/');

// D'où vient la navigation (ordinateur) : 'sidebar' (barre latérale) ou 'profile' (lignes du Profil).
// Sert à savoir si Amis / Admin s'ouvrent comme page principale (grand titre, sans Back) ou comme sous-menu.
import { ref } from 'vue';
export const navSource = ref('');
