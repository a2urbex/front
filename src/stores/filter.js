import { defineStore } from 'pinia';
import { useFilterUIStore } from './filterUI';
import { useLocationStore } from './location';

export const useFilterStore = defineStore('filter', {
  state: () => ({
    fetching: false,
    filters: {},
    selectedFilters: {},
    excludedSources: [],
    isCleared: false,
    query: '',
  }),
  actions: {
    async init() {
      try {
        if (this.fetching || Object.keys(this.filters).length) return;
        this.fetching = true;

        const locationStore = useLocationStore();
        this.filters = await locationStore.getFilters();
        // Initialize selectedFilters with default checked values
        Object.entries(this.filters).forEach(([filterKey, filterItems]) => {
          Object.entries(filterItems).forEach(([value, label]) => {
            if (label.toLowerCase() === 'france') {
              if (!this.selectedFilters[filterKey]) this.selectedFilters[filterKey] = [];
              this.selectedFilters[filterKey].push(value);
            }
          });
        });

        this.fetching = false;
        this.applyFilters();
      } catch (error) {
        this.fetching = false;
        console.error('Error fetching filters:', error);
      }
    },

    handleFilterChange(event, filterKey) {
      this.isCleared = false;
      const value = event.target.value;
      const isChecked = event.target.checked;

      if (!this.selectedFilters[filterKey]) {
        this.selectedFilters[filterKey] = [];
      }

      if (isChecked) {
        if (!this.selectedFilters[filterKey].includes(value)) {
          this.selectedFilters[filterKey].push(value);
        }
      } else {
        this.selectedFilters[filterKey] = this.selectedFilters[filterKey].filter((item) => item !== value);
      }

      this.applyFilters();
    },

    toggleExcludedSource(value) {
      const idx = this.excludedSources.indexOf(value);
      if (idx === -1) {
        this.excludedSources.push(value);
        if (this.selectedFilters.sources) {
          this.selectedFilters.sources = this.selectedFilters.sources.filter((v) => v !== value);
        }
      } else {
        this.excludedSources.splice(idx, 1);
      }
      this.applyFilters();
    },

    isExcludedSource(value) {
      return this.excludedSources.includes(value);
    },

    applyFilters() {
      const cleanedFilters = Object.keys(this.selectedFilters).reduce((acc, key) => {
        acc[key] = this.selectedFilters[key];
        return acc;
      }, {});

      if (this.query.trim()) cleanedFilters['string'] = this.query.trim();
      if (this.excludedSources.length) cleanedFilters['excludedSources'] = [...this.excludedSources];

      const locationStore = useLocationStore();
      locationStore.fetchLocations(1, cleanedFilters);
    },

    clearFilters() {
      const filterUIStore = useFilterUIStore();

      this.selectedFilters = {};
      this.excludedSources = [];
      this.query = '';
      this.isCleared = true;

      this.applyFilters();
      filterUIStore.setShowContent(false);
    },

    selectedCount(filterKey) {
      return this.selectedFilters[filterKey]?.length || 0;
    },
  },
});
