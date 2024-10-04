import { defineStore } from 'pinia';
import { request } from '@/services/api';

export const useLocationStore = defineStore('location', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
        currentPage: 1,
        totalPages: 1,
        selectedFilters: {},
        location: '',
        loading: false,
    }),
    actions: {
        async fetchLocations(page = 1, filters = {}) {
            this.loading = true; 
            try {
                this.selectedFilters = filters;
                const data = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/p/${page}`, filters);
                this.locationsList = data.list || [];
                this.currentPage = page;
                this.totalPages = Math.ceil(data.count / import.meta.env.VITE_LOCATIONS_PER_PAGE); 
            } catch (error) {
                console.error('Error fetching locations:', error);
            } finally {
                this.loading = false;
            }
        },
        async getLocation(id){
            this.loading = true; 
            try {
                const data = await request('GET', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/${id}`);
                console.log(data);
                this.location  = data;
            } catch (error) {
                console.error('Error fetching location:', error);
            } finally {
                this.loading = false;
            }
        },
        async getFilters() {
            try {
                const data = await request('GET', `${import.meta.env.VITE_LOCATIONS_FILTERS_ENDPOINT}`);
                return data;
            } catch (error) {
                throw error;
            }
        }
    }
});
