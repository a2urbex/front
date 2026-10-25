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
import AdminPinterestView from '@/views/AdminPinterest.vue'
import AdminNotifyView from '@/views/AdminNotify.vue'
import AdminImportersView from '@/views/AdminImporters.vue'
import MeView from '@/views/Me.vue'
import MeAppearanceView from '@/views/MeAppearance.vue'
import MeNotificationsView from '@/views/MeNotifications.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeView
    },
    {
      // Démo publique : session 100 % navigateur, données fictives, aucun appel à l'API
      path: '/demo',
      component: HomeView,
      // Rechargement complet : bannière, noindex, mur PWA… sont décidés au démarrage de l'app
      beforeEnter: async () => {
        const { startDemo } = await import('@/demo/session')
        startDemo()
        window.location.replace('/locations')
        return false
      },
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
      // Réglages déplacés dans l'onglet Profil
      path: '/app-settings',
      redirect: '/me',
    },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/users', component: AdminUsersView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/imports', component: AdminImportsView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/dedup', component: AdminDedupView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/sources', component: AdminSourcesView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/pinterest', component: AdminPinterestView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/notify', component: AdminNotifyView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/importers', component: AdminImportersView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/me', component: MeView, meta: { requiresAuth: true } },
    { path: '/me/notifications', component: MeNotificationsView, meta: { requiresAuth: true } },
    { path: '/me/appearance', component: MeAppearanceView, meta: { requiresAuth: true } },
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

  // Démo : aucune page de formulaire de compte (avatar, bannière, mot de passe)
  if (to.path === '/edit-profile') {
    const { isDemo } = await import('@/demo/session')
    if (isDemo()) return next({ path: '/locations' })
  }

  // Connecté : jamais l'accueil (login + animation). Un token expiré est déconnecté au 1er 401 de l'API.
  if (to.path === '/' && authStore.token) return next({ path: '/locations' })

  if (to.path === '/locations' && authStore.token) {
    const { useExplorationStore } = await import('@/stores/exploration')
    const active = useExplorationStore().active
    if (active?.favoriteId) return next({ path: `/favorites/${active.favoriteId}` })
  }

  next()
})

// Indexation : uniquement la page d'accueil. Toutes les autres routes (privées, démo) sont en noindex,
// en plus du robots.txt (Google exécute le JS et lit cette balise).
router.afterEach((to) => {
  let meta = document.querySelector('meta[name="robots"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'robots'
    document.head.appendChild(meta)
  }
  meta.content = to.path === '/' ? 'index, follow' : 'noindex, nofollow'
})

// Chaque page repart du haut : sur iPhone, le défilement (parfois encore en élan) d'une longue page
// restait appliqué à la suivante, plus courte, et n'affichait que du noir sous la barre de titre
router.afterEach((to, from) => {
  if (to.path === from.path) return
  const reset = () => {
    const el = document.querySelector('.content')
    if (!el) return
    el.style.overflowY = 'hidden' // coupe l'élan iOS
    el.scrollTop = 0
    requestAnimationFrame(() => { el.style.overflowY = '' })
  }
  reset()
  requestAnimationFrame(reset) // une fois la nouvelle page montée
})

export default router
