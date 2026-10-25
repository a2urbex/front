<script setup>
import { apiImage } from '@/utilities/apiImage';
import { computed, ref, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMapStore } from '@/stores/map';
import { useAuthStore } from '@/stores/auth';
import { useExplorationStore } from '@/stores/exploration';
import ExplorationBar from '@/components/ExplorationBar.vue';
import DemoBanner from '@/components/DemoBanner.vue';

// Barre d'onglets iOS (Explore / Lists / Outings / Profile). Le menu latéral est remplacé par l'onglet Profil (/me).
const authStore = useAuthStore();
const router = useRouter();
const mapStore = useMapStore();
const exploration = useExplorationStore();

const isLoggedIn = computed(() => authStore.token !== null);
watch(isLoggedIn, (v) => document.body.classList.toggle('has-bottom-nav', v), { immediate: true });

const avatar = computed(() => apiImage(authStore.userProfile?.image));
const avatarBroken = ref(false);

const route = computed(() => router.currentRoute.value);
const PROFILE_PATHS = ['/me', '/friends', '/edit-profile', '/app-settings'];
// L'onglet actif dépend de la section (la route), jamais de la vue List/Map du haut
const tab = computed(() => {
  const p = route.value.path;
  if (exploration.active && p === `/favorites/${exploration.active.favoriteId}`) return 'map';
  if (p === '/locations') return 'map';
  if (p.startsWith('/favorites')) return route.value.query.view === 'outings' ? 'outings' : 'lists';
  if (PROFILE_PATHS.includes(p) || p.startsWith('/me/') || p.startsWith('/admin') || p.startsWith('/profile/')) return 'profile';
  return '';
});

// En exploration, l'onglet Explore ouvre la carte de la liste active
const openMap = async () => {
  const target = exploration.active ? `/favorites/${exploration.active.favoriteId}` : '/locations';
  if (route.value.path !== target && !(!exploration.active && route.value.path.startsWith('/favorites/'))) {
    await router.push(target);
    await nextTick();
  }
  mapStore.open = true;
};
const leaveMap = () => { mapStore.open = false; };
</script>

<template>
  <nav v-if="isLoggedIn" class="header-mobile bottom-nav d-none" aria-label="Main">
    <DemoBanner />
    <ExplorationBar />
    <div class="bottom-nav__tabs">
      <button class="bottom-nav__tab" :class="{ on: tab === 'map' }" @click="openMap">
        <font-awesome-icon :icon="['fas', exploration.active ? 'compass' : 'map-location-dot']" /><span>{{ exploration.active ? 'Explore' : 'Map' }}</span>
      </button>
      <router-link class="bottom-nav__tab" :class="{ on: tab === 'lists' }" to="/favorites" @click="leaveMap">
        <font-awesome-icon :icon="['fas', 'list-ul']" /><span>Lists</span>
      </router-link>
      <router-link class="bottom-nav__tab" :class="{ on: tab === 'outings' }" :to="{ path: '/favorites', query: { view: 'outings' } }" @click="leaveMap">
        <font-awesome-icon :icon="['fas', 'calendar-days']" /><span>Outings</span>
      </router-link>
      <router-link class="bottom-nav__tab" :class="{ on: tab === 'profile' }" to="/me" @click="leaveMap">
        <img v-if="avatar && !avatarBroken" :src="avatar" class="bottom-nav__avatar" alt="" @error="avatarBroken = true" />
        <font-awesome-icon v-else :icon="['fas', 'circle-user']" /><span>Profile</span>
      </router-link>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/components/header-mobile.scss' as *;
</style>
