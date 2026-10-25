import { defineStore } from 'pinia';
import { useFilterUIStore } from './filterUI';
import { useLocationStore } from './location';
import { request } from '@/services/api';

// Géoloc envoyée uniquement si l'utilisateur l'a déjà autorisée (aucune demande ici)
const grantedPosition = async () => {
  try {
    const perm = await navigator.permissions?.query({ name: 'geolocation' });
    if (perm?.state !== 'granted') return null;
    return await new Promise((resolve) =>
      navigator.geolocation.getCurrentPosition((p) => resolve(p.coords), () => resolve(null), { timeout: 4000, maximumAge: 600000 }),
    );
  } catch {
    return null;
  }
};

export const resolveDefaultCountry = async () => {
  try {
    const pos = await grantedPosition();
    const qs = pos ? `?lat=${pos.latitude}&lon=${pos.longitude}` : '';
    const res = await request('GET', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}/country${qs}`);
    return res && pos ? { ...res, position: [pos.latitude, pos.longitude] } : res;
  } catch {
    return null;
  }
};

export const useFilterStore = defineStore('filter', {
  state: () => ({
    fetching: false,
    filters: {},
    selectedFilters: {},
    excludedSources: [],
    isCleared: false,
    query: '',
    defaultCountry: null, // pays de la personne (réglage > détecté > France)
    defaultView: null, // vue de départ de la carte : { center, zoom } ou { bounds } (null = France)
  }),
  actions: {
    async init() {
      try {
        if (this.fetching || Object.keys(this.filters).length) return;
        this.fetching = true;

        const locationStore = useLocationStore();
        this.filters = await locationStore.getFilters();
        // Pays par défaut : réglage du compte > pays détecté > FR
        const country = await resolveDefaultCountry();
        const countryId = country?.countryId != null ? String(country.countryId) : null;
        const countries = this.filters.countries || {};
        const fallback = Object.keys(countries).find((id) => countries[id].toLowerCase() === 'france');
        const selected = countryId && countries[countryId] ? countryId : fallback;
        this.defaultCountry = selected || null;
        if (selected) this.selectedFilters.countries = [selected];
        // Carte cadrée sur le pays retenu par le filtre (sinon elle montrerait une zone sans points) :
        // autour de la position GPS si c'est elle qui a donné le pays, sinon sur tout le pays
        if (selected && selected === countryId) {
          if (country.source === 'geolocation' && country.position) this.defaultView = { center: country.position, zoom: 10 };
          else if (country.bounds) this.defaultView = { bounds: country.bounds };
        }

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
      // Jamais aucun pays (= toute la base) : on retombe sur le pays de la personne
      if (!this.selectedFilters.countries?.length && this.defaultCountry) this.selectedFilters.countries = [this.defaultCountry];
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
