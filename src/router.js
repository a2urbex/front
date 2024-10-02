import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import ResetPassword from '@/components/ResetForm.vue'
import Auth from '@/views/Auth.vue'
import LocationList from '@/views/LocationList.vue'
import Map from '@/views/Map.vue'
import HomeView from '@/views/Home.vue'
import LocationView from '@/views/LocationView.vue'
import FavoritesListView from '@/views/FavoritesList.vue'
import FavoritesDetailView from '@/views/FavoritesListLocations.vue'
import WorkInProgress from '@/components/WorkInProgress.vue'
import FriendsList from '@/components/FriendsList.vue'
import Profile from '@/components/ProfileVue.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeView
    },
    {
      path: '/locations',
      component: LocationList
    },
    {
      path: '/location/:id',
      component: LocationView
    },
    {
      path: '/favorites',
      component: FavoritesListView
    },
    {
      path: '/favorites/:id',
      component: FavoritesDetailView,
      props: route => ({ id: route.params.id })
    },
    {
      path: '/map',
      component: Map
    },
    {
      path: '/friends',
      component: FriendsList
    },
    {
      path: '/profile/:id',
      component: Profile,
      props: route => ({ id: route.params.id })
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
