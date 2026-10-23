<script setup>
import { apiImage } from '@/utilities/apiImage';
import { forceAppUpdate } from '@/utilities/appUpdate';
import { computed, ref, nextTick, watch } from 'vue';
import { useMapStore } from '@/stores/map';
import { useExplorationStore } from '@/stores/exploration';
import ExplorationBar from '@/components/ExplorationBar.vue';
import DemoBanner from '@/components/DemoBanner.vue';
import { isDemo } from '@/demo/session';
const demo = isDemo();
import { useAuthStore } from '@/stores/auth';
import { useVersionStore } from '@/stores/version';
import { useRouter } from 'vue-router';
import { useFilterUIStore } from '@/stores/filterUI';
import Title from '@/components/Title.vue';
import Filters from '@/components/Filters.vue';

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
  return apiImage(userProfile.value.image);
});

const isOpen = ref(false);
watch(isLoggedIn, (v) => document.body.classList.toggle('has-bottom-nav', v), { immediate: true });
const avatarBroken = ref(false);

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

const clearCache = forceAppUpdate;

const mapStore = useMapStore();
const exploration = useExplorationStore();
const route = computed(() => router.currentRoute.value);
// L'onglet actif dépend de la section (la route), jamais de la vue List/Map du haut
const tab = computed(() => {
  if (isOpen.value) return 'profile';
  const p = route.value.path;
  if (exploration.active && p === `/favorites/${exploration.active.favoriteId}`) return 'map';
  if (p === '/locations') return 'map';
  if (p.startsWith('/favorites')) return route.value.query.view === 'outings' ? 'outings' : 'lists';
  return '';
});


// En exploration, l'onglet Map ouvre la carte de la liste active
const openMap = async () => {
  isOpen.value = false;
  const target = exploration.active ? `/favorites/${exploration.active.favoriteId}` : '/locations';
  if (route.value.path !== target && !(!exploration.active && route.value.path.startsWith('/favorites/'))) {
    await router.push(target);
    await nextTick();
  }
  mapStore.open = true;
};

const isLocationsRoute = computed(() => {
  return router.currentRoute.value.path === '/locations';
});
</script>

<template>
  <nav v-if="isLoggedIn" class="header-mobile bottom-nav d-none">
    <DemoBanner />
    <ExplorationBar />
    <div class="bottom-nav__tabs">
    <button class="bottom-nav__tab" :class="{ on: tab === 'map' }" @click="openMap">
      <font-awesome-icon :icon="['fas', exploration.active ? 'compass' : 'map-location-dot']" /><span>{{ exploration.active ? 'Explore' : 'Map' }}</span>
    </button>
    <router-link class="bottom-nav__tab" :class="{ on: tab === 'lists' }" to="/favorites" @click="isOpen = false; mapStore.open = false">
      <font-awesome-icon :icon="['fas', 'list-ul']" /><span>Lists</span>
    </router-link>
    <router-link class="bottom-nav__tab" :class="{ on: tab === 'outings' }" :to="{ path: '/favorites', query: { view: 'outings' } }" @click="isOpen = false; mapStore.open = false">
      <font-awesome-icon :icon="['fas', 'calendar-days']" /><span>Outings</span>
    </router-link>
    <button class="bottom-nav__tab" :class="{ on: tab === 'profile' }" @click="toggleOpen">
      <img v-if="profileImageUrl && !avatarBroken" :src="profileImageUrl" class="bottom-nav__avatar" alt="" @error="avatarBroken = true" />
      <font-awesome-icon v-else :icon="['fas', 'user']" /><span>Profile</span>
    </button>
    </div>
  </nav>

  <div :class="{ 'header-mobile__user-info': true, 'open': isOpen }">
      <Title @click="toggleOpen" title="Menu" :hasPageWidth="false" :goHistory="false" />
      <div class="header-mobile__user-info-wrapper page-width">
        <router-link class="header-mobile__profile" :to="'/profile/'+ userProfile.id" @click="() => { filterUIStore.setShowContent(false); toggleOpen() }">
          <img v-if="isLoggedIn" :src="profileImageUrl" class="header-mobile__user-image" /> <span>{{ userProfile.username }}</span>
        </router-link>
        <div v-if="isLocationsRoute" class="header-mobile__filters-wrapper d-none">
          <Filters idPrefix="mobile-" :hideSearch="true" />
        </div>
        <div class="header-mobile__user-entries">
          <p class="header-mobile__user-entry header-mobile__add-entry" @click="handleAddLocation">
            <font-awesome-icon :icon="['fa', 'plus']" /> Add a location
          </p>
          <router-link v-if="!demo" class="header-mobile__user-entry header-mobile__settings" to="/edit-profile" @click="toggleOpen">
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
          <router-link v-if="userProfile.isAdmin"  class="header-mobile__user-entry" to="/admin" @click="toggleOpen">
            <font-awesome-icon :icon="['fa', 'gear']" />Admin
          </router-link>
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
@use '@/assets/styles/components/header-mobile.scss' as *;
</style> 