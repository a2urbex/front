<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute } from 'vue-router';
import Title from '@/components/Title.vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useMapStore } from '@/stores/map';
import { useExplorationStore } from '@/stores/exploration';
import { usePositionStore } from '@/stores/position';
import { toast } from 'vue3-toastify';


import SpotGrid from '@/components/SpotGrid.vue';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';
import PreLoader from '../components/PreLoader.vue';
import MapHeader from '@/components/MapHeader.vue';


const route = useRoute();
const favoritesStore = useFavoritesStore();
const mapStore = useMapStore();
const authStore = useAuthStore();

const locationsListItems = computed(() => favoritesStore.locationsListItems.list || []);
const selectedLocation = ref(null);
const isLoading = computed(() => favoritesStore.loading);

function showLocationCardDisplay(location) {
    selectedLocation.value = location;
}

// Visiteur non connecté (lien de partage) : uniquement la carte avec les points de la liste
const loggedIn = computed(() => !!authStore.token);
const sharedMissing = ref(false);

onMounted(async () => {
    const id = route.params.id;
    if (!loggedIn.value) {
        mapStore.sharedLoaded = false;
        mapStore.setType('shared', id);
        await nextTick();
        if (id) await favoritesStore.getFavorites(id);
        sharedMissing.value = !locationsListItems.value.length;
        mapStore.locations = [...locationsListItems.value];
        return;
    }
    if (id) await favoritesStore.getFavorites(id);
    mapStore.setType('favorite', id);
});

const exploration = useExplorationStore();
const listId = computed(() => route.params.id);
const isExploring = computed(() => exploration.active?.favoriteId === listId.value);
const listStatus = ref('upcoming');
const position = usePositionStore();
const starting = ref(false);
const STATUS = { in_progress: 'In progress', finished: 'Explored' };
// Une seule exploration à la fois : bloquée si une autre liste est en cours
const otherRunning = computed(() => !!exploration.active && !isExploring.value);

watch(() => favoritesStore.locationsListItems, (l) => {
    listStatus.value = l?.status || 'upcoming';
}, { immediate: true });

const toggleExploration = async () => {
    if (otherRunning.value) return;
    if (isExploring.value) {
        await exploration.end();
        listStatus.value = 'finished';
    } else {
        // Localisation obligatoire : le tap déclenche le prompt si elle n'est pas encore autorisée
        if (starting.value) return;
        starting.value = true;
        const ok = await position.request();
        starting.value = false;
        if (!ok) {
            const why = { insecure: 'Location needs a secure (HTTPS) connection.', denied: 'Location is blocked. Allow it in your browser settings to start.' }[position.error] || 'Unable to get your location. Try again outside.';
            toast.error(why, { position: toast.POSITION.TOP_CENTER, autoClose: 3500, theme: 'dark' });
            return;
        }
        await exploration.start(listId.value);
        listStatus.value = 'in_progress';
        mapStore.open = true;
    }
};

const listName = computed(() => favoritesStore.locationsListItems.name || 'No List Name');
</script>

<template>
  <template v-if="loggedIn">
    <Title :title="listName" :backgroundTransparent="false" />
    <MapHeader class="small-header" />

    <!-- En-tête de liste : résumé + bouton d'exploration -->
    <div class="list-head" v-if="!isLoading">
        <p class="list-head__meta">
            {{ locationsListItems.length }} spot{{ locationsListItems.length === 1 ? '' : 's' }}
            <span v-if="STATUS[isExploring ? 'in_progress' : listStatus]" class="list-badge" :class="isExploring ? 'is-live' : 'is-done'">{{ STATUS[isExploring ? 'in_progress' : listStatus] }}</span>
        </p>
        <button class="list-head__go" :class="{ on: isExploring }" :disabled="otherRunning" @click="toggleExploration">
            <font-awesome-icon :icon="['fas', isExploring ? 'xmark' : 'compass']" />
            {{ isExploring ? 'End exploration' : starting ? 'Locating…' : 'Start exploration' }}
        </button>
        <p v-if="otherRunning" class="list-head__note">"{{ exploration.active.name }}" is being explored. End it first.</p>
    </div>

    <transition name="fade" mode="out-in">
        <PreLoader msg="List" v-if="isLoading" key="preloader" /> 
    </transition>

    <SpotGrid class="favorites-containers" :items="locationsListItems" @open-location="showLocationCardDisplay" />

    <LocationCardDisplay 
        v-if="selectedLocation" 
        :location="selectedLocation" 
        @close="selectedLocation = null"
    />
  </template>
  <template v-else>
    <div class="share-chip">
      <img src="/logox192.png" alt="" />
      <span class="share-chip__title">{{ favoritesStore.locationsListItems.name || 'Shared list' }}<small v-if="locationsListItems.length"> · {{ locationsListItems.length }} spots</small></span>
      <router-link to="/" class="share-chip__login">Log in</router-link>
    </div>
    <p v-if="sharedMissing && !isLoading" class="share-note">This list is private, or it doesn't exist anymore.</p>
    <!-- Vue liste (carte fermée) : les spots de la liste, fiche simplifiée au tap -->
    <div v-if="!mapStore.open && locationsListItems.length" class="guest-list">
      <SpotGrid class="favorites-containers" :items="locationsListItems" @open-location="showLocationCardDisplay" />
    </div>
    <LocationCardDisplay v-if="selectedLocation && !mapStore.open" :location="selectedLocation" @close="selectedLocation = null" />
    <button v-if="locationsListItems.length" class="view-toggle view-toggle--guest" @click="mapStore.open = !mapStore.open" :aria-label="mapStore.open ? 'Show as list' : 'Show on map'">
      <font-awesome-icon :icon="['fas', mapStore.open ? 'list-ul' : 'map-location-dot']" />
      {{ mapStore.open ? 'List' : 'Map' }}
    </button>
  </template>
</template>

<style lang="scss">
@use '../assets/styles/components/locationList.scss' as *;
</style>
