<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useFavoritesStore } from '@/stores/favorites';
import { useMapStore } from '@/stores/map';

import LocationCard from '@/components/LocationCard.vue';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';
import PreLoader from '../components/PreLoader.vue';


const route = useRoute();
const favoritesStore = useFavoritesStore();
const mapStore = useMapStore();

const locationsListItems = computed(() => favoritesStore.locationsListItems.list.list || []);
const selectedLocation = ref(null);
const isLoading = computed(() => favoritesStore.loading);

function showLocationCardDisplay(location) {
    selectedLocation.value = location;
}

onMounted(async () => {
    const id = route.params.id;
    if (id) await favoritesStore.getFavorites(id);
    mapStore.type = 'favorite';
    mapStore.typeId = id;
});

const listName = computed(() => favoritesStore.locationsListItems.name || 'No List Name');

watch(() => favoritesStore.locationsListItems.list, (newValue) => {
    console.log('Locations List Items updated:', newValue);
});

</script>

<template>

    <transition name="fade" mode="out-in">
        <PreLoader msg="List" v-if="isLoading" key="preloader" /> 
    </transition>

    <div class="locations-header page-width">
        <h1>{{ listName }}</h1> 
    </div>
    <div class="locations-container page-width">
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
@import '../assets/styles/components/locationList.scss';
</style>
