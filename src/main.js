import { createApp } from 'vue'
import router from './router'
import './assets/styles/base.scss'

import App from './App.vue'

createApp(App).use(router).mount('#app')
