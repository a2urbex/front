<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import Title from '@/components/Title.vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useMapStore } from '@/stores/map';
import { useExplorationStore } from '@/stores/exploration';
import { usePositionStore } from '@/stores/position';
import { toast } from 'vue3-toastify';


import LocationCard from '@/components/LocationCard.vue';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';
import PreLoader from '../components/PreLoader.vue';
import MapHeader from '@/components/MapHeader.vue';


const route = useRoute();
const favoritesStore = useFavoritesStore();
const mapStore = useMapStore();

const locationsListItems = computed(() => favoritesStore.locationsListItems.list || []);
const selectedLocation = ref(null);
const isLoading = computed(() => favoritesStore.loading);

function showLocationCardDisplay(location) {
    selectedLocation.value = location;
}

onMounted(async () => {
    const id = route.params.id;
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
    <Title :title="listName" :backgroundTransparent="false" />
    <MapHeader class="small-header" />

    <div class="list-planning page-width" v-if="!isLoading">
        <span v-if="STATUS[isExploring ? 'in_progress' : listStatus]" class="list-planning__status" :class="`is-${isExploring ? 'in_progress' : listStatus}`">
            {{ STATUS[isExploring ? 'in_progress' : listStatus] }}
        </span>
        <button class="list-planning__go" :class="{ on: isExploring }" :disabled="otherRunning" @click="toggleExploration">
            {{ isExploring ? 'End exploration' : starting ? 'Locating…' : 'Start exploration' }}
        </button>
        <p v-if="otherRunning" class="list-planning__note">"{{ exploration.active.name }}" is being explored. End it first.</p>
    </div>

    <transition name="fade" mode="out-in">
        <PreLoader msg="List" v-if="isLoading" key="preloader" /> 
    </transition>

    <div class="locations-container favorites-containers page-width">
        <LocationCard 
            v-for="location in locationsListItems" 
            :key="location.id" 
            :location="location" 
            @open-location="showLocationCardDisplay" 
        />
    </div>

    <LocationCardDisplay 
        v-if="selectedLocation" 
        :location="selectedLocation" 
        @close="selectedLocation = null"
    />
</template>

<style lang="scss">
@use '../assets/styles/components/locationList.scss' as *;
</style>
