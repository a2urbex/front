<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useVersionStore } from '@/stores/version';
import { useRouter } from 'vue-router';
import { useFilterUIStore } from '@/stores/filterUI';
import Title from '@/components/Title.vue';

const versionStore = useVersionStore();
const authStore = useAuthStore();
const router = useRouter();
const filterUIStore = useFilterUIStore();

const emit = defineEmits(['toggle-add-location']);
const latest_version = computed(() => versionStore.latest_version);
const code_version = computed(() => versionStore.code_version);
const status = computed(() => versionStore.status);

const isLoggedIn = computed(() => authStore.token !== null);
const userProfile = computed(() => authStore.userProfile);

const profileImageUrl = computed(() => {
  return userProfile.value.image
    ? `${import.meta.env.VITE_API_BASE_URL}${userProfile.value.image}`
    : '';
});

const isOpen = ref(false);

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const handleAddLocation = () => {
  isOpen.value = false;
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

const isLocationsRoute = computed(() => {
  return router.currentRoute.value.path === '/locations';
});
</script>

<template>
  <div v-if="isLoggedIn" class="header-mobile d-none">
    <router-link class="header-mobile__home" to="/locations">
      <font-awesome-icon :icon="['fa', 'house']" />
    </router-link>
    <router-link class="header-mobile__favorites" to="/friends"  @click="isOpen = false">
      <font-awesome-icon :icon="['fa', 'users']" />
    </router-link>
    <p class="header-mobile__add" @click="() => { handleAddLocation(); isOpen = false }">
      <font-awesome-icon :icon="['fa', 'plus']" />
    </p>
    <router-link class="header-mobile__favorites" to="/favorites" @click="isOpen = false">
      <font-awesome-icon :icon="['fa', 'heart']" />
    </router-link>
    <img :src="profileImageUrl" class="header-mobile__user-image" @click="toggleOpen" />

    <!-- USER MENU -->
  </div>

  <div :class="{ 'header-mobile__user-info': true, 'open': isOpen }">
      <Title @click="toggleOpen" title="Menu" :hasPageWidth="false" />
      <div class="header-mobile__user-info-wrapper">
        <router-link class="header-mobile__profile" :to="'/profile/'+ userProfile.id" @click="() => { filterUIStore.setShowContent(false); toggleOpen() }">
          <img v-if="isLoggedIn" :src="profileImageUrl" class="header-mobile__user-image" /> <span>{{ userProfile.username }}</span>
        </router-link>
        <div class="header-mobile__user-entries">
          <router-link class="header-mobile__user-entry header-mobile__settings" to="/profile" @click="toggleOpen">
            <font-awesome-icon :icon="['fa', 'gear']" />Account settings
          </router-link>
          <router-link class="header-mobile__user-entry" to="/Locations" @click="toggleOpen">
            <font-awesome-icon :icon="['fa', 'map-pin']" /> Locations
          </router-link>
          <router-link class="header-mobile__user-entry" to="/favorites" @click="toggleOpen">
            <font-awesome-icon :icon="['fa', 'heart']" /> Favorites
          </router-link>
          <router-link class="header-mobile__user-entry" to="/friends" @click="toggleOpen">
            <font-awesome-icon :icon="['fa', 'users']" /> Friends
          </router-link>
          <a v-if="userProfile.isAdmin" class="header-mobile__user-entry header-mobile__admin" href="https://a2urbex.eu/admin" @click="toggleOpen">
            <font-awesome-icon :icon="['fas', 'gavel']" />Admin
          </a>
          <router-link class="header-mobile__user-entry" to="/app-settings" @click="toggleOpen">
            <font-awesome-icon v-if="status === 'up-to-date'" :icon="['fa', 'wrench']" />
            <font-awesome-icon v-if="status === 'outdated'" :icon="['fa', 'triangle-exclamation']" />App Settings
          </router-link>
          <span class="header-mobile__user-separator"></span>
          <p class="header-mobile__logout" @click="() => { logout(); toggleOpen(); }">
            <font-awesome-icon :icon="['fas', 'right-from-bracket']" />Sign out
          </p>
        </div>
      </div>
    </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/header-mobile.scss';
</style> 