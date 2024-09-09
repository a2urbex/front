<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import LocationCard from '@/components/LocationCard.vue';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';

const favoritesStore = useFavoritesStore();
const route = useRoute();

const locationsListItems = computed(() => favoritesStore.locationsListItems.list.list || []);
const selectedLocation = ref(null);

function showLocationCardDisplay(location) {
    selectedLocation.value = location;
}

onMounted(async () => {
    const id = route.params.id;
    if (id) {
        await favoritesStore.getFavorites(id);
    }
});

const listName = computed(() => favoritesStore.locationsListItems.name || 'No List Name');

watch(() => favoritesStore.locationsListItems.list, (newValue) => {
    console.log('Locations List Items updated:', newValue);
});

</script>

<template>
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
