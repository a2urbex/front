import { defineStore } from 'pinia';
import { request } from '@/services/api';

export const useFavoritesStore = defineStore('Favorites', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
        locationsListItems: []
    }),
    actions: {
        async getList() {
            try {
                const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}`, this);
                this.locationsList = data || [];
            } catch (error) {
                throw error;
            }
        },
        async getFavorites(id) {
            try {
                const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}`, this);
                this.locationsListItems = data.list || [];
            } catch (error) {
                throw error;
            }
        },

        async getCurrentParams() {
            // TODO
        },

        async disableList(id){
            // TODO
        },



    }
});
