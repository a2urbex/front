import { defineStore } from 'pinia';
import { request } from '@/services/api';

export const useLocationStore = defineStore('location', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
        currentPage: 1,
        totalPages: 1,
        selectedFilters: {}
    }),
    actions: {
        async fetchLocations(page = 1, filters = {}) {
            try {
                this.selectedFilters = filters;
                const data = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/p/${page}`, this, filters);
                this.locationsList = data.list || [];
                this.currentPage = page;
                this.totalPages = Math.ceil(data.count / import.meta.env.VITE_LOCATIONS_PER_PAGE); 
            } catch (error) {
                throw error;
            }
        },
        async getFilters() {
            try {
                const data = await request('GET', `${import.meta.env.VITE_LOCATIONS_FILTERS_ENDPOINT}`, this);
                return data;
            } catch (error) {
                throw error;
            }
        }
    }
});
