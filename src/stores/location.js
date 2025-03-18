import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useLocationStore = defineStore('location', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
        nextPageCache: [],
        currentPage: 1,
        hasMore: true,
        selectedFilters: {},
        location: '',
        loading: false,
        totalLocations: null,
    }),
    actions: {
        async fetchLocations(page = 1, filters = {}, loading) {
            if (loading != false) {
                this.loading = true;
            }
            try {
                this.selectedFilters = filters;
                const data = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/p/${page}`, filters);
                console.log('API Response:', data);
                this.locationsList = data.list || [];
                this.totalLocations = data.total || data.count || data.locationsList?.length || 0;
                console.log('Total Locations set to:', this.totalLocations);
                this.currentPage = page;
                this.hasMore = (data.list || []).length === parseInt(import.meta.env.VITE_LOCATIONS_PER_PAGE);
                
                // Pre-fetch next page
                if (this.hasMore) {
                    this.prefetchNextPage();
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
            } finally {
                this.loading = false;
            }
        },

        async prefetchNextPage() {
            try {
                const nextPage = this.currentPage + 1;
                const data = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/p/${nextPage}`, this.selectedFilters);
                this.nextPageCache = data.list || [];
            } catch (error) {
                console.error('Error pre-fetching next page:', error);
            }
        },

        async fetchNextPage() {
            if (this.loading || !this.hasMore) return;
            
            try {
                this.loading = true;
                
                // Use cached data if available
                if (this.nextPageCache.length > 0) {
                    this.locationsList = [...this.locationsList, ...this.nextPageCache];
                    this.currentPage += 1;
                    this.hasMore = this.nextPageCache.length === parseInt(import.meta.env.VITE_LOCATIONS_PER_PAGE);
                    this.nextPageCache = [];
                    
                    // Pre-fetch next page if there might be more
                    if (this.hasMore) {
                        this.prefetchNextPage();
                    }
                } else {
                    // Fallback to regular fetch if cache is empty
                    const nextPage = this.currentPage + 1;
                    const data = await request('POST', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/p/${nextPage}`, this.selectedFilters);
                    const newLocations = data.list || [];
                    
                    this.locationsList = [...this.locationsList, ...newLocations];
                    this.currentPage = nextPage;
                    this.hasMore = newLocations.length === parseInt(import.meta.env.VITE_LOCATIONS_PER_PAGE);
                    
                    // Pre-fetch next page if there might be more
                    if (this.hasMore) {
                        this.prefetchNextPage();
                    }
                }
            } catch (error) {
                console.error('Error fetching more locations:', error);
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
