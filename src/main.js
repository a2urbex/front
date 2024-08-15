import { createApp } from 'vue'
import router from './router'
import { createPinia } from 'pinia';
import './assets/styles/base.scss'
import 'vue3-toastify/dist/index.css';
import App from './App.vue'

createApp(App).use(router).use(createPinia()).mount('#app')

