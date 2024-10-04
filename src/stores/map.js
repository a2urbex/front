import { toRaw } from 'vue';
import { defineStore } from 'pinia';

import { request } from '@/services/api';
import { useLocationStore } from './location';

export const useMapStore = defineStore('Map', {
  state: () => ({
    open: false,
    type: null,
    typeId: null,
    locations: [],
    loaded: { type: null, typeId: null, filters: null },
  }),
  actions: {
    setType(type, typeId = null) {
      this.type = type;
      this.typeId = typeId;
    },
    async getMapLocations() {
      const location = useLocationStore();
      const filters = toRaw(location.selectedFilters)
      const isSamePage = this.type === this.loaded.type && this.typeId === this.loaded.typeId;

      if(this.type === 'favorite') {
        if(isSamePage) return this.locations;
        this.locations = await this.loadFavorite(this.typeId);
      }

      if(this.type === 'location') {
        if(isSamePage && JSON.stringify(filters) === JSON.stringify(this.loaded.filters)) return this.locations;
        this.locations = await this.loadLocation(filters)
      }
      
      this.loaded = { type: this.type, typeId: this.typeId, filters: filters };
    },
    async loadLocation(filters) {
      try {
        const data = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/map`, filters);
        return data.list || []
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    },
    async loadFavorite(id) {
      try {
        const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}`);
        return data.list || []
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    }
  }
})