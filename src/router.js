import { createRouter, createWebHistory } from 'vue-router'

// AUTH
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import ResetPassword from '@/components/ResetForm.vue'
import NewPassword from '@/components/NewPassword.vue'
import Auth from '@/views/Auth.vue'

// FAVORITES
import FavoritesListView from '@/views/FavoritesList.vue'
import FavoritesDetailView from '@/views/FavoritesListLocations.vue'

// LOCATIONS
import LocationView from '@/views/LocationView.vue'
import LocationList from '@/views/LocationList.vue'
import LocationAdd from '@/components/LocationAdd.vue'

// USER
import FriendsList from '@/components/FriendsList.vue'
import Profile from '@/components/ProfileVue.vue'

// NAVIGATION 
import HomeView from '@/views/Home.vue'

// APP SETTINGS
import AppSettingsView from '@/views/AppSettings.vue'


export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeView
    },
    {
      path: '/location/add',
      component : LocationAdd
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
      path: '/friends',
      component: FriendsList
    },
    {
      path: '/profile/:id',
      component: Profile,
      props: route => ({ id: route.params.id })
    },
    {
      path: '/app-settings',
      component: AppSettingsView
    },
    {
      path: '/',
      component: Auth,
      children: [
        { path: 'login', component: LoginForm },
        { path: 'register', component: RegisterForm },
        { path: 'forgot-password', component: ResetPassword },
        { path: 'reset-password/:id', 
          component: NewPassword,
          props: route => ({ id: route.params.id })
        }
      ]
    }
  ],
})
