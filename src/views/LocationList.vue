<script setup>
import { ref, onMounted, computed } from 'vue';
import { useLocationStore } from '@/stores/location';
import LocationCard from '@/components/LocationCard.vue';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';
import Filters from '@/components/Filters.vue';

const locationStore = useLocationStore();

const locationsList = computed(() => locationStore.locationsList);
const currentPage = computed(() => locationStore.currentPage);
const totalPages = computed(() => locationStore.totalPages);

const selectedLocation = ref(null);

const pagesToShow = computed(() => {
    if (totalPages.value <= 1) return [];

    const pages = [];
    const start = Math.max(1, currentPage.value - 2);
    const end = Math.min(totalPages.value, currentPage.value + 2);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
});

function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
        locationStore.fetchLocations(page, locationStore.selectedFilters);
    }
}

function showLocationCardDisplay(location) {
    selectedLocation.value = location;
}

function isLargeItem(index) {
    return index % 2 === 0; 
}

onMounted(() => {
    locationStore.fetchLocations(1);
});
</script>


<template>
    <Filters />
    <div class="locations-container page-width">
        <LocationCard 
            v-for="(location, index) in locationsList" 
            :key="location.id" 
            :location="location" 
            :class="{'large': isLargeItem(index)}"
            @open-location="showLocationCardDisplay" 
        />
    </div>

    <LocationCardDisplay 
        v-if="selectedLocation" 
        :location="selectedLocation" 
        @close="selectedLocation = null"
    />

    <div class="locations-container__paginate">
        <div class="locations-container__paginate-buttons">
            <button class="locations-container__paginate-ext" 
                v-if="totalPages > 1 && currentPage > 3" 
                @click="goToPage(1)">
                1
            </button>
            <button 
                v-for="page in pagesToShow" 
                :key="page" 
                @click="goToPage(page)" 
                :class="{ active: page === currentPage }">
                {{ page }}
            </button>
            <button class="locations-container__paginate-ext" 
                v-if="totalPages > 1 && currentPage < totalPages" 
                @click="goToPage(totalPages)">
                {{ totalPages }}
            </button>
        </div>
    </div>
</template>

<style lang="scss">
@import '../assets/styles/components/locationList.scss';
</style>
