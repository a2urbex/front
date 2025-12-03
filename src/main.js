import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
// PWA 
import { registerSW } from 'virtual:pwa-register';
// Styling
import './assets/styles/base.scss'
import 'vue3-toastify/dist/index.css';
import FontAwesomeIcon from './utilities/fontawesome-icons';

// Redirection globale: a2urbex.eu -> a2urbex.com temporairement pour migration de données
if (window.location.hostname.includes('a2urbex.eu')) {
  const newUrl = window.location.href.replace('a2urbex.eu', 'a2urbex.com');
  window.location.replace(newUrl);
}

const updateSW = registerSW({
    onNeedRefresh() { },
    onOfflineReady() { },
});

createApp(App).component('font-awesome-icon', FontAwesomeIcon).use(router).use(createPinia()).mount('#app')

