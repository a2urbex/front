<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useVersionStore } from '@/stores/version';
import { useRouter } from 'vue-router';

const versionStore = useVersionStore();
const authStore = useAuthStore();
const router = useRouter();

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
</script>

<template>
  <div class="header-desktop page-width m-none">
    <div class="header-desktop__left">
      <router-link v-if="!isLoggedIn" class="header-desktop__home" to="/">Home</router-link>
      <router-link v-if="isLoggedIn" class="header-desktop__home" to="/locations">Locations</router-link>
    </div>

    <div class="header-desktop__right">
      <router-link v-if="isLoggedIn" class="header-desktop__favorites" to="/friends">
        <font-awesome-icon :icon="['fa', 'users']" />
      </router-link>
      <router-link v-if="isLoggedIn" class="header-desktop__favorites" to="/favorites">
        <font-awesome-icon :icon="['fa', 'heart']" />
      </router-link>
      <img v-if="isLoggedIn" :src="profileImageUrl" class="header-desktop__user-image" @click="toggleOpen" />
      <div v-if="isLoggedIn" :class="{ 'header-desktop__user-info': true, 'open': isOpen }">
        <div class="header-desktop__user-info-wrapper">
          <router-link :to="'/profile/'+ userProfile.id" class="header-desktop__user-entry header-desktop__profile" @click="toggleOpen">
            <font-awesome-icon :icon="['fa', 'user']" />My profile <span>@{{ userProfile.username }}</span>
          </router-link>
          <router-link class="header-desktop__user-entry header-desktop__settings" to="/edit-profile" @click="toggleOpen">
            <font-awesome-icon :icon="['fa', 'gear']" />Account settings
          </router-link>
          <p class="header-desktop__user-entry header-desktop__settings" @click="handleAddLocation">
            <font-awesome-icon :icon="['fa', 'plus']" /> Add Location
          </p>
          <router-link v-if="userProfile.isAdmin" class="header-desktop__user-entry header-desktop__admin" to="/admin" @click="toggleOpen">
            <font-awesome-icon :icon="['fas', 'mobile-button']" />Admin
          </router-link>
          <span class="header-desktop__user-separator"></span>
          <p class="header-desktop__user-entry header-desktop__logout" @click="() => { logout(); toggleOpen(); }">
            <font-awesome-icon :icon="['fas', 'right-from-bracket']" />Sign out
          </p>
        </div>
      </div>
      <router-link v-else class="header-desktop__connect" to="/login">Connect</router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/header-desktop.scss';
</style> 