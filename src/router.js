import { createRouter, createWebHistory } from 'vue-router'

// AUTH
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import ResetPassword from '@/components/ResetForm.vue'
import NewPassword from '@/components/NewPassword.vue'
import Auth from '@/views/Auth.vue'

// EDIT PROFILE
import EditProfile from '@/views/EditProfile.vue'

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

// ADMIN
import AdminView from '@/views/Admin.vue'
import AdminUsersView from '@/views/AdminUsers.vue'
import AdminImportsView from '@/views/AdminImports.vue'
import AdminDedupView from '@/views/AdminDedup.vue'
import AdminSourcesView from '@/views/AdminSources.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeView
    },
    {
      path: '/location/add',
      component : LocationAdd,
      meta: { requiresAuth: true }
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
      component: FavoritesListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/favorites/:id',
      component: FavoritesDetailView,
      props: route => ({ id: route.params.id }),
      meta: { requiresAuth: true }
    },
    {
      path: '/friends',
      component: FriendsList,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/:id',
      component: Profile,
      props: route => ({ id: route.params.id }),
      meta: { requiresAuth: true }
    },
    {
      path: '/app-settings',
      component: AppSettingsView,
      meta: { requiresAuth: true }
    },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/users', component: AdminUsersView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/imports', component: AdminImportsView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/dedup', component: AdminDedupView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/sources', component: AdminSourcesView, meta: { requiresAuth: true, requiresAdmin: true } },
    {
      path: '/edit-profile',
      component: EditProfile,
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      component: Auth,
      children: [
        {
          path: 'login',
          redirect: { path: '/', query: { auth: 'login' } }
        },
        {
          path: 'register',
          redirect: { path: '/', query: { auth: 'register' } }
        },
        {
          path: 'forgot-password',
          redirect: { path: '/', query: { auth: 'forgot' } }
        },
        { path: 'reset-password/:id',
          component: NewPassword,
          props: route => ({ id: route.params.id })
        }
      ]
    }
  ],
})

import { useAuthStore } from '@/stores/auth'

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.token) {
    return next({ path: '/', query: { auth: 'login' } })
  }

  if (to.meta.requiresAdmin) {
    if (authStore.token && (!authStore.userProfile || authStore.userProfile.isAdmin === undefined)) {
      try { await authStore.fetchUserProfile() } catch (_) {}
    }
    if (!authStore.userProfile?.isAdmin) return next({ path: '/' })
  }

  next()
})

export default router
