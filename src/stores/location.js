import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

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
        async fetchLocations(page = 1, filters = {}, loading) {
           if (loading != false) {
            this.loading = true;
           } 
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
        },

        async addLocation(formData) {
            try {
                const data = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}`, formData); 
                this.fetchLocations(1);
                toast.success('Added successfully!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
                return data;
            } catch (error) {
                console.error('Error adding location:', error);
                throw error;
            }
        }
    }
});
