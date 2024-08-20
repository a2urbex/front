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

const updateSW = registerSW({
    onNeedRefresh() { },
    onOfflineReady() { },
});

createApp(App).component('font-awesome-icon', FontAwesomeIcon).use(router).use(createPinia()).mount('#app')

