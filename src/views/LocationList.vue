<script setup>
import { ref, onMounted, computed } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useMapStore } from '@/stores/map';
import SpotGrid from '@/components/SpotGrid.vue';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';
import Filters from '@/components/Filters.vue';
import PreLoader from '../components/PreLoader.vue';
import MapHeader from '@/components/MapHeader.vue';

const locationStore = useLocationStore();
const mapStore = useMapStore();

const locationsList = computed(() => locationStore.locationsList);
const isLoading = computed(() => locationStore.loading);
const selectedLocation = ref(null);
const loadMoreTrigger = ref(null);

function showLocationCardDisplay(location) {
  selectedLocation.value = location;
}

function setupInfiniteScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      const trigger = entries[0];
      if (trigger.isIntersecting && !isLoading.value && locationStore.locationsList.length) {
        locationStore.fetchNextPage();
      }
    },
    {
      rootMargin: '100px',
    },
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }

  return () => observer.disconnect();
}

onMounted(() => {
  // locationStore.fetchLocations(1);
  mapStore.setType('location');
  setupInfiniteScroll();
});
</script>

<template>
  <Filters class="d-none" />
  <MapHeader />

  <transition name="fade" mode="out-in">
    <PreLoader msg="Locations" v-if="isLoading && locationsList.length === 0" key="preloader" />
  </transition>

  <SpotGrid :items="locationsList" @open-location="showLocationCardDisplay" />
  <div ref="loadMoreTrigger" class="load-more-trigger"></div>

  <LocationCardDisplay v-if="selectedLocation" :location="selectedLocation" @close="selectedLocation = null" />

  <div v-if="isLoading && locationsList.length > 0" class="loading-more">
    <svg class="loading-svg" viewBox="0 0 50 50">
      <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
    </svg>
  </div>
</template>

<style lang="scss">
@use '../assets/styles/components/locationList.scss' as *;
</style>
