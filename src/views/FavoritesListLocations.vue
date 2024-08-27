<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import LocationCard from '@/components/LocationCard.vue';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';

const favoritesStore = useFavoritesStore();
const route = useRoute();

const locationsListItems = computed(() => favoritesStore.locationsListItems.list);
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
</script>

<template>
    <div class="locations-container page-width">
        <LocationCard 
            v-for="(location, index) in locationsListItems" 
            :key="location.id" 
            :location="location" 
            @open-location="showLocationCardDisplay" 
        />
    </div>
    <LocationCardDisplay 
        v-if="selectedLocation" 
        :location="selectedLocation.value" 
        @close="selectedLocation = null"
    />
</template>

<style lang="scss">
@import '../assets/styles/components/locationList.scss';
</style>
