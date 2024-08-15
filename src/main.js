import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
// Styling
import './assets/styles/base.scss'
import 'vue3-toastify/dist/index.css';
import FontAwesomeIcon from './utilities/fontawesome-icons';

createApp(App).component('font-awesome-icon', FontAwesomeIcon).use(router).use(createPinia()).mount('#app')

