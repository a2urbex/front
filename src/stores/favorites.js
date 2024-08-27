import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useFavoritesStore = defineStore('Favorites', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
        locationsListItems: [],
        favoriteList: []
    }),
    actions: {
        async getSummary() {
            try {
                const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/summary`, this);
                this.favoriteList = data || [];
            } catch (error) {
                throw error;
            }
        },

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

        async addLocation(id, list){
            try {
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${list}/location/${id}`, this);
                toast.success('Added to your favorite list!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async getCurrentParams() {
            // TODO
        },

        async updateVisibility(id){
            try {
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}/disable`, this);
                this.getList();
                toast.success('Successfully updated visibility!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async updatePrivacy(id){
            try {
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}/share`, this);
                this.getList();
                toast.success('Successfully updated privacy!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async deleteList(id){
            try {
                await request('DELETE', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}`, this);
                this.getList();
                toast.success('List successfully deleted!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        }
    }
});
