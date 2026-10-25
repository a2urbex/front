<script setup>
import { ref, onMounted, toRaw, computed } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useFilterUIStore } from '@/stores/filterUI';
import { useAuthStore } from '@/stores/auth';
import { useFilterStore } from '../stores/filter';

const props = defineProps({
  idPrefix: {
    type: String,
    default: '',
  },
  hideSearch: {
    type: Boolean,
    default: false,
  },
});

const locationStore = useLocationStore();
const authStore = useAuthStore();
const filterUIStore = useFilterUIStore();
const filterStore = useFilterStore();

const isAdmin = computed(() => authStore.userProfile?.isAdmin || false);

const filteredFilters = computed(() => {
  if (!filterStore.filters) return {};

  const filtersCopy = { ...filterStore.filters };
  if (!isAdmin.value && 'sources' in filtersCopy) delete filtersCopy.sources;

  return filtersCopy;
});

onMounted(async () => {
  filterStore.init();
});

const pressTimer = ref(null);
const pressTriggered = ref(false);

const startSourcePress = (value) => {
  pressTriggered.value = false;
  pressTimer.value = setTimeout(() => {
    pressTriggered.value = true;
    filterStore.toggleExcludedSource(value);
  }, 500);
};

const cancelSourcePress = (event) => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  if (pressTriggered.value && event) {
    event.preventDefault();
    event.stopPropagation();
  }
};
</script>

<template>
  <div class="filter__container" :class="{ active: filterUIStore.showContent && !hideSearch }">
    <div class="filter__wrapper" :class="{ active: filterUIStore.showContent && !hideSearch }">
      <div class="filter__search" v-if="!hideSearch">
        <label class="ios-search filter__field" :for="`${idPrefix}filter-q`">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
          <input :id="`${idPrefix}filter-q`" type="search" placeholder="Search spots" autocomplete="off" @focus="filterUIStore.setShowContent(true)" v-model="filterStore.query" @input="filterStore.applyFilters" />
        </label>
        <button
          class="filter__search-close d-none"
          v-if="filterUIStore.showContent"
          @click="filterUIStore.setShowContent(false)"
          style="animation: fadeIn 0.1s ease-in"
        >
          Cancel
        </button>
      </div>

      <div class="filter__filters" v-show="filterUIStore.showContent || hideSearch">
        <div class="filter__group">
        <div v-for="(filterItems, filterKey) in filteredFilters" :key="filterKey" class="filter-section">
          <input class="filter__item" type="checkbox" :id="`${idPrefix}${filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}`" />
          <label :for="`${idPrefix}${filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}`">
            <p class="filter__item-content-title">
              <span class="filter__name">{{ filterKey.charAt(0).toUpperCase() + filterKey.slice(1) }}</span>
              <span class="filter__value">{{ filterStore.selectedCount(filterKey) ? `${filterStore.selectedCount(filterKey)} selected` : 'All' }}</span>
              <span class="close-item">
                <font-awesome-icon :icon="['fas', 'angle-left']" />
              </span>
            </p>

            <div class="filter__item-content">
              <div class="filter__item-input-container">
                <div
                  class="filter__item-input"
                  :class="{ excluded: filterKey === 'sources' && filterStore.isExcludedSource(value) }"
                  v-for="(label, value) in filterItems"
                  :key="value"
                  @dblclick.prevent="filterKey === 'sources' && filterStore.toggleExcludedSource(value)"
                  @touchstart="filterKey === 'sources' && startSourcePress(value)"
                  @touchend="filterKey === 'sources' && cancelSourcePress($event)"
                  @touchmove="filterKey === 'sources' && cancelSourcePress()"
                  @touchcancel="filterKey === 'sources' && cancelSourcePress()"
                  :title="filterKey === 'sources' ? 'Double-click (or long-press) to hide this source on the map' : ''"
                >
                  <input
                    type="checkbox"
                    :id="`${idPrefix}${filterKey}-${value}`"
                    :value="value"
                    @change="(event) => filterStore.handleFilterChange(event, filterKey)"
                    :checked="filterStore.selectedFilters[filterKey]?.includes(value) || (!filterStore.isCleared && label.toLowerCase() === 'france' && !filterStore.selectedFilters[filterKey])"
                  />
                  <label :for="`${idPrefix}${filterKey}-${value}`">{{ label }}</label>
                </div>
              </div>
            </div>
          </label>
        </div>
        </div>
        <div class="filter__results d-none" v-if="locationStore.totalLocations !== null">
          {{ Number(locationStore.totalLocations).toLocaleString('en-US') }} spot{{ locationStore.totalLocations !== 1 ? 's' : '' }} match
        </div>
        <button @click="filterStore.clearFilters" class="filter__clear">Reset filters</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/components/filters.scss' as *;
</style>
