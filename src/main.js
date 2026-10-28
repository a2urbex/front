import { createApp } from 'vue'
import swipeClose from './directives/swipeClose'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
// PWA 
import { registerSW } from 'virtual:pwa-register';
import { startDemo } from './demo/session';
import { applyAccent } from './utilities/accent';
applyAccent();

// Styling
import './assets/styles/base.scss'
import 'vue3-toastify/dist/index.css';
import './utilities/toastDefaults';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './assets/styles/theme.scss';
import './assets/styles/pages.scss';
import FontAwesomeIcon from './utilities/fontawesome-icons';
import './utilities/pwa';

// Redirection globale: a2urbex.eu -> a2urbex.com temporairement pour migration de données
if (window.location.hostname.includes('a2urbex.eu')) {
  const newUrl = window.location.href.replace('a2urbex.eu', 'a2urbex.com');
  window.location.replace(newUrl);
}

// Mise à jour : on vérifie au retour au premier plan + toutes les 30 min. La nouvelle version s'installe
// en arrière-plan SANS recharger la page (sinon chaque retour dans l'app la rechargeait) : elle s'applique
// à la prochaine ouverture, et la popup « Update available » propose de l'appliquer tout de suite.
registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
        if (!registration) return;
        const check = () => registration.update().catch(() => {});
        setInterval(check, 30 * 60 * 1000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    },
    onNeedRefresh() { },
    // une nouvelle version a pris la main : pas de rechargement (le plugin rechargerait sinon)
    onNeedReload() { },
    onOfflineReady() { },
});

// Nettoie le paramètre anti-cache ajouté par "Refresh App"
if (new URLSearchParams(location.search).has('v')) {
    const clean = new URL(location.href);
    clean.searchParams.delete('v');
    history.replaceState(history.state, '', clean.toString());
}


// Accès direct /demo : session démo activée avant tout rendu, puis ouverture de l'app (aucun passage par l'accueil)
if (window.location.pathname.replace(/\/+$/, '') === '/demo') {
    startDemo();
    window.location.replace('/locations');
} else {
    createApp(App).component('font-awesome-icon', FontAwesomeIcon).directive('swipe-close', swipeClose).use(router).use(createPinia()).mount('#app')
}

