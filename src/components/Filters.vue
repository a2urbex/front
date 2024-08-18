<script setup>
import { ref, onMounted, toRaw } from 'vue';
import { useLocationStore } from '@/stores/location';

const locationStore = useLocationStore();
const filters = ref({});
const selectedFilters = ref({});
const query = ref('');
const showContent = ref(false);

onMounted(async () => {
  try {
    filters.value = await locationStore.getFilters();
    console.log("Filters available:", filters.value);
  } catch (error) {
    console.error('Error fetching filters:', error);
  }
});

function handleFilterChange(event, filterKey) {
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
</script>

<template>
  <div class="filter__container" v-if="filters && Object.keys(filters).length > 0">
    <div class="filter__wrapper" :class="{ active: showContent }">
      <button @click="showContent = false" class="filter__wrapper-close d-none">
        <font-awesome-icon :icon="['fas', 'xmark']" />
      </button>
      <div class="filter__search">
        <div class="filter__icon d-none" @click="showContent = true">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
        </div>
        <input type="text" placeholder="Search locations..." @click="showContent = true" v-model="query" @input="applyFilters" />
      </div>

      <div class="filter__filters">
        <div v-for="(filterItems, filterKey) in filters" :key="filterKey" class="filter-section">
          <input class="filter__item" type="radio" name="identifier"
            :id="filterKey.charAt(0).toUpperCase() + filterKey.slice(1)">
          <label :for="filterKey.charAt(0).toUpperCase() + filterKey.slice(1)">
            <p class="filter__item-content-title">{{ filterKey.charAt(0).toUpperCase() + filterKey.slice(1) }} <label for="close" class="close-item d-none">
              <font-awesome-icon :icon="['fas', 'angle-left']" />
            </label></p>
            <div class="filter__item-content">
              <input class="filter__item" type="radio" name="identifier" id="close">
              <label for="close" class="filter__item-close m-none">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </label>
              <div class="filter__item-input-container">
                <div class="filter__item-input" v-for="(label, value) in filterItems" :key="value">
                  <input type="checkbox" :id="`${filterKey}-${value}`" :value="value"
                    @change="(event) => handleFilterChange(event, filterKey)" />
                  <label :for="`${filterKey}-${value}`">{{ label }}</label>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
      <div class="filter__icon m-none">
        <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
      </div>
    </div>
  </div>
  <div v-else>
    <p>Loading filters...</p>
  </div>
</template>

<style lang="scss" scoped>
@import '../assets/styles/components/filters.scss';
</style>