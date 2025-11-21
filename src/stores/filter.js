import { defineStore } from 'pinia';
import { useFilterUIStore } from './filterUI';
import { useLocationStore } from './location';

export const useFilterStore = defineStore('filter', {
  state: () => ({
    fetching: false,
    filters: {},
    selectedFilters: {},
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

    applyFilters() {
      const cleanedFilters = Object.keys(this.selectedFilters).reduce((acc, key) => {
        acc[key] = this.selectedFilters[key];
        return acc;
      }, {});

      if (this.query.trim()) cleanedFilters['string'] = [this.query.trim()];

      const locationStore = useLocationStore();
      locationStore.fetchLocations(1, cleanedFilters);
    },

    clearFilters() {
      const filterUIStore = useFilterUIStore();

      this.selectedFilters = {};
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
