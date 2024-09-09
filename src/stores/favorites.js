import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useFavoritesStore = defineStore('Favorites', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
        locationsListItems: {
            name: '',
            list: []   
        },
        favoriteList: [],
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
                console.log('API Response:', data);
                this.locationsListItems = {
                    name: data.name || '',
                    list: data.list || { list: [] }
                };
            } catch (error) {
                console.error('Error fetching favorites:', error);
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
                await this.getList();  // Ensure that the list is updated after visibility change
                toast.success('Successfully updated visibility!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async updatePrivacy(id){
            try {
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}/share`, this);
                await this.getList();  // Ensure that the list is updated after privacy change
                toast.success('Successfully updated privacy!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async deleteList(id){
            try {
                await request('DELETE', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}`, this);
                await this.getList();  // Ensure that the list is updated after deletion
                toast.success('List successfully deleted!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        }
    }
});
