import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/Home.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeView,
    },
    // {
    //   path: '/about',
    //   component: () => import('@/components/AboutView.vue'),
    // },
  ],
})
