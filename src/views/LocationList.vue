<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useMapStore } from '@/stores/map';
import LocationCard from '@/components/LocationCard.vue';
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
const visibleCards = ref(new Set());

function showLocationCardDisplay(location) {
  selectedLocation.value = location;
}

function isLargeItem(index) {
  return index % 2 === 0;
}

function setupCardObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleCards.value.add(entry.target.dataset.id);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '50px',
    },
  );

  return observer;
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

  const cardObserver = setupCardObserver();
  const observeCards = () => {
    document.querySelectorAll('.locations-container .card-appear').forEach((card) => {
      cardObserver.observe(card);
    });
  };

  // Observe initial cards
  observeCards();

  // Watch for new cards being added
  const observer = new MutationObserver(observeCards);
  observer.observe(document.querySelector('.locations-container'), {
    childList: true,
  });

  // Cleanup
  onUnmounted(() => {
    cardObserver.disconnect();
    observer.disconnect();
  });
});
</script>

<template>
  <Filters class="d-none" />
  <MapHeader />

  <transition name="fade" mode="out-in">
    <PreLoader msg="Locations" v-if="isLoading && locationsList.length === 0" key="preloader" />
  </transition>

  <div class="locations-container page-width">
    <LocationCard
      v-for="(location, index) in locationsList"
      :key="location.id"
      :location="location"
      :class="{
        large: isLargeItem(index),
        'card-appear': true,
        'card-visible': visibleCards.has(location.id),
      }"
      :data-id="location.id"
      @open-location="showLocationCardDisplay"
    />
    <div ref="loadMoreTrigger" class="load-more-trigger"></div>
  </div>

  <LocationCardDisplay v-if="selectedLocation" :location="selectedLocation" @close="selectedLocation = null" />

  <div v-if="isLoading && locationsList.length > 0" class="loading-more">
    <svg class="loading-svg" viewBox="0 0 50 50">
      <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
    </svg>
  </div>
</template>

<style lang="scss">
@import '../assets/styles/components/locationList.scss';
</style>
