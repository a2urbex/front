<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

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

onMounted(async () => {
  if (isLoggedIn.value) {
    await authStore.fetchUserProfile();
  }
});
</script>

<template>
  <div class="header page-width m-none">
    <div class="header__left">
      <router-link v-if="!isLoggedIn" class="header__home" to="/">Home</router-link>
      <router-link v-if="isLoggedIn" class="header__home" to="locations">Locations</router-link>
    </div>

    <div class="header__right">
      <!-- USER -->
      <router-link  v-if="isLoggedIn" class="header__favorites" to="/friends">
        <font-awesome-icon :icon="['fa', 'users']" />
      </router-link>
      <router-link v-if="isLoggedIn" class="header__favorites" to="/favorites">
        <font-awesome-icon :icon="['fa', 'heart']" />
      </router-link>
      <img v-if="isLoggedIn" :src="profileImageUrl" class="header__user-image" @click="toggleOpen" />
      <div v-if="isLoggedIn" :class="{ 'header__user-info': true, 'open': isOpen }">
        <div class="header__user-info-wrapper">
          <router-link class="header__user-entry header__profile" to="/profile">
            <font-awesome-icon :icon="['fa', 'user']" />My profile <span>@{{ userProfile.username }}</span>
          </router-link>
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

  <div v-if="isLoggedIn" class="header page-width d-none">
      <router-link class="header__home" to="locations"><font-awesome-icon :icon="['fa', 'house']" /></router-link>
      <router-link class="header__favorites" to="/friends">
        <font-awesome-icon :icon="['fa', 'users']" />
      </router-link>
      <router-link  class="header__map" to="/map">
        <font-awesome-icon :icon="['fas', 'map-location-dot']" />
      </router-link>
      <router-link class="header__favorites" to="/favorites">
        <font-awesome-icon :icon="['fa', 'heart']" />
      </router-link>
      <img :src="profileImageUrl" class="header__user-image" @click="toggleOpen" />
      <div :class="{ 'header__user-info': true, 'open': isOpen }">
        <span class="header__user-info-close" @click="toggleOpen"></span>
        <div class="header__user-info-wrapper">
          <router-link class="header__user-entry header__profile" to="/profile">
            <font-awesome-icon :icon="['fa', 'user']" />My profile <span>@{{ userProfile.username }}</span>
          </router-link>
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
    </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/header.scss';
</style>
