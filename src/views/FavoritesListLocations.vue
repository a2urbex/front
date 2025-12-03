<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import Title from '@/components/Title.vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useMapStore } from '@/stores/map';


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

const listName = computed(() => favoritesStore.locationsListItems.name || 'No List Name');
</script>

<template>
    <Title :title="listName" :backgroundTransparent="false" />
    <MapHeader class="small-header" />

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
