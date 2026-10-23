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
    loading: false,
    showInvalid: false,
    zone: null,
    dateFrom: null,
    dateTo: null,
    clipTo: null,
    highlightFrom: null,
    loaded: { type: null, typeId: null, filters: null },
  }),
  actions: {
    setType(type, typeId = null) {
      this.type = type;
      this.typeId = typeId;
    },
    setZone(zone) {
      this.zone = zone;
      this.getMapLocations();
    },
    setDateRange(from, to, highlightFrom = null) {
      this.dateFrom = from ? new Date(from).toISOString() : null;
      this.dateTo = to ? new Date(to).toISOString() : null;
      this.highlightFrom = highlightFrom;
      this.getMapLocations();
    },
    async getMapLocations(force = false) {
      const location = useLocationStore();
      const filters = toRaw(location.selectedFilters)
      const filtersSnapshot = { ...JSON.parse(JSON.stringify(filters)), showInvalid: this.showInvalid, zone: this.zone, dateFrom: this.dateFrom, dateTo: this.dateTo }
      // Cache seulement s'il y a réellement des points en mémoire (la liste est vidée à chaque changement de page)
      const isSamePage = !force && this.locations?.length > 0 && this.type === this.loaded.type && this.typeId === this.loaded.typeId;

      this.loading = true;
      try {
        if(this.type === 'favorite') {
          if(isSamePage) return this.locations;
          this.locations = await this.loadFavorite(this.typeId);
        }

        if(this.type === 'location') {
          if(isSamePage && JSON.stringify(filtersSnapshot) === JSON.stringify(this.loaded.filters)) return this.locations;
          this.locations = await this.loadLocation(filtersSnapshot)
        }

        this.loaded = { type: this.type, typeId: this.typeId, filters: filtersSnapshot };
      } finally {
        this.loading = false;
      }
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
        const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}${this.showInvalid ? '?showInvalid=1' : ''}`);
        const list = data.list || []
        navigator.serviceWorker?.controller?.postMessage({
          type: 'CACHE_LIST',
          urls: list.flatMap((l) => [l.image, l.image_maps]),
        })
        return list
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    }
  }
})