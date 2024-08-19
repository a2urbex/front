import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import ResetPassword from '@/components/ResetForm.vue'
import Auth from '@/views/Auth.vue'
import LocationList from '@/views/LocationList.vue'
import Map from '@/views/Map.vue'
import HomeView from '@/views/Home.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeView,
      meta: { transition: 'none' }
    },
    {
      path: '/locations',
      component: LocationList
    },
    {
      path: '/map',
      component: Map
    },
    {
      path: '/',
      component: Auth,
      children: [
        { path: 'login', component: LoginForm },
        { path: 'register', component: RegisterForm },
        { path: 'forgot-password', component: ResetPassword }
      ]
    }
  ],
})
