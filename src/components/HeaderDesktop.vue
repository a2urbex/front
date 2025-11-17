<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useVersionStore } from '@/stores/version';
import { useFilterUIStore } from '@/stores/filterUI';
import { useMapStore } from '@/stores/map';
import { useRouter } from 'vue-router';
import Filters from '@/components/Filters.vue';

const versionStore = useVersionStore();
const authStore = useAuthStore();
const filterUIStore = useFilterUIStore();
const mapStore = useMapStore();
const router = useRouter();

const emit = defineEmits(['toggle-add-location']);
const latest_version = computed(() => versionStore.latest_version);
const code_version = computed(() => versionStore.code_version);
const status = computed(() => versionStore.status);

const isLoggedIn = computed(() => authStore.token !== null);
const userProfile = computed(() => authStore.userProfile);
const isLocationsRoute = computed(() => router.currentRoute.value.path === '/locations');
const isFavoritesRoute = computed(() => router.currentRoute.value.path.includes('/favorites/'));

const profileImageUrl = computed(() => {
  return userProfile.value.image
    ? `${import.meta.env.VITE_API_BASE_URL}${userProfile.value.image}`
    : '';
});

const isUserSectionOpen = ref(false);

const toggleUserSection = () => {
  isUserSectionOpen.value = !isUserSectionOpen.value;
};

const handleAddLocation = () => {
  emit('toggle-add-location');
};

const logout = async () => {
  authStore.logout();
};

const clearCache = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      registration.unregister();
    }
  }
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('Caches cleared:' + cacheNames);
    for (let cacheName of cacheNames) {
      console.log('Caches cleared:' + cacheName);
      caches.delete(cacheName); 
    }
  }
  window.location.reload();
};
</script>

<template>
  <div v-if="isLoggedIn" class="header-desktop m-none">
    <div class="header-desktop__logo">
      <router-link v-if="isLoggedIn" class="header-desktop__logo-link" to="/locations">
        A2Urbex
      </router-link>
      <router-link v-else class="header-desktop__logo-link" to="/">
        A2Urbex
      </router-link>
    </div>

    <div v-if="isLoggedIn" class="header-desktop__content">
      <nav class="header-desktop__section header-desktop__section--primary">
        <router-link class="header-desktop__nav-link" to="/locations">
          <font-awesome-icon :icon="['fa', 'map-pin']" />
          <span>Locations</span>
        </router-link>
        <router-link class="header-desktop__nav-link" to="/favorites">
          <font-awesome-icon :icon="['fa', 'heart']" />
          <span>Favorites</span>
        </router-link>
        <router-link class="header-desktop__nav-link" to="/friends">
          <font-awesome-icon :icon="['fa', 'users']" />
          <span>Friends</span>
        </router-link>
        <button class="header-desktop__add" @click="handleAddLocation">
            <font-awesome-icon :icon="['fa', 'plus']" />
            <span>Add Location</span>
        </button>
      </nav>

      <div v-if="isLocationsRoute" class="header-desktop__section header-desktop__section--filters">
        <div class="header-desktop__filters-inline">
          <Filters idPrefix="desktop-" />
        </div>
      </div>

      <div v-if="isLocationsRoute || isFavoritesRoute" class="header-desktop__section header-desktop__section--map">
        <p class="header-desktop__section-label">View</p>
        <div class="header-desktop__map-toggle">
          <button
            class="header-desktop__map-btn"
            :class="{ active: !mapStore.open }"
            @click="mapStore.open = false"
          >
            List
          </button>
          <button
            class="header-desktop__map-btn"
            :class="{ active: mapStore.open }"
            @click="mapStore.open = true"
          >
            Map
          </button>
        </div>
      </div>

      <div class="header-desktop__section header-desktop__section--secondary">
        <router-link class="header-desktop__nav-link" to="/app-settings">
          <font-awesome-icon v-if="status === 'up-to-date'" :icon="['fa', 'wrench']" />
          <font-awesome-icon v-else-if="status === 'outdated'" :icon="['fa', 'triangle-exclamation']" />
          <span>App Settings</span>
        </router-link>
        <router-link v-if="userProfile.isAdmin" class="header-desktop__nav-link" to="/admin">
          <font-awesome-icon :icon="['fa', 'gear']" />
          <span>Admin</span>
        </router-link>
      </div>

      <div class="header-desktop__section header-desktop__section--user">
        <div class="header-desktop__profile" @click="toggleUserSection">
          <img :src="profileImageUrl" class="header-desktop__profile-avatar" />
          <div class="header-desktop__profile-meta">
            <span class="header-desktop__profile-name">{{ userProfile.username }}</span>
            <span class="header-desktop__profile-handle">@{{ userProfile.username }}</span>
          </div>
          <span class="header-desktop__profile-toggle">
            <font-awesome-icon :icon="['fas', 'angle-down']" :class="{ open: isUserSectionOpen }" />
          </span>
        </div>

        <div v-if="isUserSectionOpen" class="header-desktop__user-menu">
          <router-link class="header-desktop__nav-link" :to="'/profile/' + userProfile.id">
            <font-awesome-icon :icon="['fa', 'user']" />
            <span>My profile</span>
          </router-link>

          <router-link class="header-desktop__nav-link" to="/edit-profile">
            <font-awesome-icon :icon="['fa', 'gear']" />
            <span>Account settings</span>
          </router-link>

          <button class="header-desktop__logout" @click="logout">
            <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="header-desktop__content header-desktop__content--guest">
      <router-link class="header-desktop__home" to="/">Home</router-link>
      <router-link class="header-desktop__connect" to="/login">Connect</router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/header-desktop.scss';
</style> 