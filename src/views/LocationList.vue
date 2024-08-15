<template>
    <div class="locations-container page-width">
        <LocationCard v-for="(location, index) in locationsList" :key="location.id" :location="location" />
    </div>
    <div class="locations-container__paginate">
        <div class="locations-container__paginate-buttons">
            <button class="locations-container__paginate-ext" v-if="totalPages > 1 && currentPage > 3"
                @click="goToPage(1)">1</button>
            <button v-for="page in pagesToShow" :key="page" @click="goToPage(page)"
                :class="{ active: page === currentPage }">{{ page }}</button>
            <button class="locations-container__paginate-ext" v-if="totalPages > 1 && currentPage < totalPages"
                @click="goToPage(totalPages)">
                {{ totalPages }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { useLocationStore } from '@/stores/location';
import { onMounted, computed } from 'vue';
import LocationCard from '@/components/LocationCard.vue';

const locationStore = useLocationStore();

const locationsList = computed(() => locationStore.locationsList);
const currentPage = computed(() => locationStore.currentPage);
const totalPages = computed(() => locationStore.totalPages);

// Generate an array of page numbers to show
const pagesToShow = computed(() => {
    if (totalPages.value <= 1) return []; // No pages to show if totalPages is 1 or less

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
        locationStore.goToPage(page);
    }
}

onMounted(() => {
    locationStore.fetchLocations(1);
});
</script>

<style lang="scss">
@import '../assets/styles/components/locationList.scss';
</style>
