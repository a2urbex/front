<script setup>
import { onMounted, computed, ref } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useAuthStore } from '@/stores/auth';
import { useVersionStore } from '@/stores/version';
import { useMapStore } from '@/stores/map';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';

const versionStore = useVersionStore();
const authStore = useAuthStore();
const mapStore = useMapStore();
const router = useRouter();

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

const logout = async () => {
  authStore.logout();
  setTimeout(() => {
    router.push('/login');
  }, 1500);
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

onMounted(async () => {
  await versionStore.getVersion();
  if (isLoggedIn.value) {
    try {
      await authStore.fetchUserProfile();
    } catch (error) {
      authStore.logout();
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  }
});
</script>

<template>
  <div class="header page-width m-none">
    <div class="header__left">
      <router-link v-if="!isLoggedIn" class="header__home" to="/">Home</router-link>
      <router-link v-if="isLoggedIn" class="header__home" to="/locations">Locations</router-link>
    </div>

    <div class="header__right">
      <!-- USER -->
      <router-link v-if="isLoggedIn" class="header__favorites" to="/friends">
        <font-awesome-icon :icon="['fa', 'users']" />
      </router-link>
      <router-link v-if="isLoggedIn" class="header__favorites" to="/favorites">
        <font-awesome-icon :icon="['fa', 'heart']" />
      </router-link>
      <img v-if="isLoggedIn" :src="profileImageUrl" class="header__user-image" @click="toggleOpen" />
      <div v-if="isLoggedIn" :class="{ 'header__user-info': true, 'open': isOpen }">
        <div class="header__user-info-wrapper">
          <a class="header__user-entry header__profile" :href="'/profile/'+ userProfile.id">
            <font-awesome-icon :icon="['fa', 'user']" />My profile <span>@{{ userProfile.username }}</span>
          </a>
          <router-link class="header__user-entry header__settings" to="/profile">
            <font-awesome-icon :icon="['fa', 'gear']" />Account settings
          </router-link>
          <router-link v-if="userProfile.isAdmin" class="header__user-entry header__admin" to="/admin">
            <font-awesome-icon :icon="['fas', 'mobile-button']" />Admin
          </router-link>
          <span class="header__user-separator"></span>
          <p class="header__user-entry header__logout" @click="logout">
            <font-awesome-icon :icon="['fas', 'right-from-bracket']" />Sign out
          </p>
        </div>
      </div>
      <router-link v-else class="header__connect" to="/login">Connect</router-link>
    </div>
  </div>

  <!-- Small Header (Mobile) -->
  <div v-if="isLoggedIn" class="header page-width d-none">
    <router-link class="header__home" to="/locations"><font-awesome-icon :icon="['fa', 'house']" /></router-link>
    <router-link class="header__favorites" to="/friends">
      <font-awesome-icon :icon="['fa', 'users']" />
    </router-link>
    <div class="header__map" @click="mapStore.open = !mapStore.open">
      <font-awesome-icon :icon="['fas', 'map-location-dot']" />
    </div>
    <router-link class="header__favorites" to="/favorites">
      <font-awesome-icon :icon="['fa', 'heart']" />
    </router-link>
    <img :src="profileImageUrl" class="header__user-image" @click="toggleOpen" />
    <div :class="{ 'header__user-info': true, 'open': isOpen }">
      <span class="header__user-info-close" @click="toggleOpen"></span>
      <div class="header__user-info-wrapper">
        <a class="header__user-entry header__profile" :href="'/profile/'+ userProfile.id">
          <font-awesome-icon :icon="['fa', 'user']" />My profile <span>@{{ userProfile.username }}</span>
        </a>
        <router-link class="header__user-entry header__settings" to="/profile">
          <font-awesome-icon :icon="['fa', 'gear']" />Account settings
        </router-link>
        <router-link v-if="userProfile.isAdmin" class="header__user-entry header__admin" to="/admin">
          <font-awesome-icon :icon="['fas', 'mobile-button']" />Admin
        </router-link>
        <div v-if="status === 'up-to-date'" class="header__user-entry refresh">
          <font-awesome-icon :icon="['fa', 'rotate-right']" />
          <p class="uptodate" >Up to date </p><span>v{{ code_version }}</span>
        </div>
        <div v-if="status === 'outdated'" @click="clearCache" class="header__user-entry refresh">
          <font-awesome-icon :icon="['fa', 'rotate-right']" />
          <button class="outaded">Refresh App</button><span>Latest : v{{ latest_version }}</span>
        </div>
        <span class="header__user-separator"></span>
        <p class="header__user-entry header__logout" @click="logout">
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" />Sign out
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/header.scss';
</style>
