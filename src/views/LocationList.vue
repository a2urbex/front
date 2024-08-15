<template>
    <div class="locations-container page-width">
        <LocationCard v-for="(location, index) in locationsList" :key="location.id" :location="location" />
    </div>
</template>

<script setup>
import { useLocationStore } from '@/stores/location';
import { onMounted, computed } from 'vue';
import LocationCard from '@/components/LocationCard.vue';

const LocationStore = useLocationStore();

const locationsList = computed(() => LocationStore.locationsList);

async function getLocation() {
    try {
        await LocationStore.locations(1);
    } catch (error) {
        console.error('Loading failed:', error.message || 'An unexpected error occurred.');
    }
}

onMounted(() => {
    getLocation();
});
</script>

<style lang="scss">
@import '../assets/styles/components/locationList.scss';
</style>
