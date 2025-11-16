<script setup>
import { ref, onMounted, toRaw, computed } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useFilterUIStore } from '@/stores/filterUI';
import { useAuthStore } from '@/stores/auth';

const locationStore = useLocationStore();
const filterUIStore = useFilterUIStore();
const authStore = useAuthStore();
const filters = ref({});
const selectedFilters = ref({});
const query = ref('');
const isCleared = ref(false);

const isAdmin = computed(() => authStore.userProfile?.isAdmin || false);

const filteredFilters = computed(() => {
  if (!filters.value) return {};
  
  const filtersCopy = { ...filters.value };
  if (!isAdmin.value && 'sources' in filtersCopy) {
    delete filtersCopy.sources;
  }
  return filtersCopy;
});

onMounted(async () => {
  try {
    filters.value = await locationStore.getFilters();
    // Initialize selectedFilters with default checked values
    Object.entries(filters.value).forEach(([filterKey, filterItems]) => {
      Object.entries(filterItems).forEach(([value, label]) => {
        if (label.toLowerCase() === 'france') {
          if (!selectedFilters.value[filterKey]) {
            selectedFilters.value[filterKey] = [];
          }
          selectedFilters.value[filterKey].push(value);
        }
      });
    });
    // Apply filters will call fetchLocations with the correct filters
    applyFilters();
  } catch (error) {
    console.error('Error fetching filters:', error);
  }
});

function handleFilterChange(event, filterKey) {
  isCleared.value = false;
  const value = event.target.value;
  const isChecked = event.target.checked;

  if (!selectedFilters.value[filterKey]) {
    selectedFilters.value[filterKey] = [];
  }

  if (isChecked) {
    if (!selectedFilters.value[filterKey].includes(value)) {
      selectedFilters.value[filterKey].push(value);
    }
  } else {
    selectedFilters.value[filterKey] = selectedFilters.value[filterKey].filter(item => item !== value);
  }

  applyFilters();
}

function applyFilters() {
  const cleanedFilters = Object.keys(selectedFilters.value).reduce((acc, key) => {
    acc[key] = toRaw(selectedFilters.value[key]);
    return acc;
  }, {});

  if (query.value.trim()) {
    cleanedFilters['string'] = [query.value.trim()];
  }

  locationStore.fetchLocations(1, cleanedFilters);
}

function clearFilters() {
  selectedFilters.value = {};
  query.value = '';
  isCleared.value = true;
  applyFilters();
  filterUIStore.setShowContent(false);
}
</script>

<template>
  <div class="filter__container" :class="{ active: filterUIStore.showContent }">
    <div class="filter__wrapper" :class="{ active: filterUIStore.showContent }">
      <div class="filter__search">
        <div class="filter__icon d-none">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
        </div>
        <input type="text" 
          placeholder="Search locations..." 
          @focus="filterUIStore.setShowContent(true)" 
          v-model="query" 
          @input="applyFilters" />
        <button class="filter__search-close d-none" v-if="filterUIStore.showContent" @click="filterUIStore.setShowContent(false)" style="animation: fadeIn 0.1s ease-in">
          Close
        </button>
      </div>

      <div class="filter__filters" v-show="filterUIStore.showContent">
        <div v-for="(filterItems, filterKey) in filteredFilters" :key="filterKey" class="filter-section">
          <input class="filter__item" type="radio" name="identifier"
            :id="filterKey.charAt(0).toUpperCase() + filterKey.slice(1)">
          <label :for="filterKey.charAt(0).toUpperCase() + filterKey.slice(1)">
            <p class="filter__item-content-title">{{ filterKey.charAt(0).toUpperCase() + filterKey.slice(1) }} <label for="close" class="close-item d-none">
              <font-awesome-icon :icon="['fas', 'angle-left']" />
            </label></p>
            <div class="filter__item-content">
              <input class="filter__item" type="radio" name="identifier" id="close">
              <label for="close" class="filter__item-close d-none">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </label>
              <div class="filter__item-input-container">
                <div class="filter__item-input" v-for="(label, value) in filterItems" :key="value">
                  <input type="checkbox" :id="`${filterKey}-${value}`" :value="value"
                    @change="(event) => handleFilterChange(event, filterKey)"
                    :checked="!isCleared && label.toLowerCase() === 'france'" />
                  <label :for="`${filterKey}-${value}`">{{ label }}</label>
                </div>
              </div>
            </div>
          </label>
        </div>
        <div class="filter__results d-none" v-if="locationStore.totalLocations !== null">
        {{ locationStore.totalLocations }} location{{ locationStore.totalLocations !== 1 ? 's' : '' }} found
      </div>
      <button @click="clearFilters" class="filter__clear">
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../assets/styles/components/filters.scss';
</style>