import { toRaw, markRaw } from 'vue';
import { defineStore } from 'pinia';

import { request } from '@/services/api';
import { useLocationStore } from './location';
import { isDemo } from '@/demo/session';

export const useMapStore = defineStore('Map', {
  state: () => ({
    open: false,
    type: 'location', // carte globale par défaut (panneau ordinateur : la carte est visible sur toutes les pages)
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
    // Carte globale : les points ne se chargent qu'après « Load spots » (une fois par ouverture de l'app),
    // puis restent en mémoire tant que les filtres ne changent pas (navigation entre menus = pas de rechargement)
    spotsRequested: isDemo(), // démo : points fictifs chargés tout de suite
    globalCache: { key: null, list: null },
    needsCountry: false,
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
          // jamais toute la base : sans pays (et sans zone), on attend que le pays par défaut soit connu
          if (!filtersSnapshot.countries?.length && !this.zone) { this.needsCountry = true; return this.locations; }
          this.needsCountry = false;
          const key = JSON.stringify(filtersSnapshot);
          if (!force && this.globalCache.key === key && this.globalCache.list) {
            this.locations = this.globalCache.list;
          } else {
            const list = await this.loadLocation(filtersSnapshot);
            // markRaw : 10 000 points sans proxies réactifs, beaucoup plus léger
            this.globalCache = { key, list: markRaw(list || []) };
            this.locations = this.globalCache.list;
          }
        }

        this.loaded = { type: this.type, typeId: this.typeId, filters: filtersSnapshot };
      } finally {
        this.loading = false;
      }
    },
    // Garde le cache aligné après une modification locale (statut, suppression)
    syncCache() {
      if (this.type === 'location' && this.globalCache.key) this.globalCache = { ...this.globalCache, list: markRaw([...this.locations]) };
    },
    requestSpots() {
      this.spotsRequested = true;
      return this.getMapLocations();
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