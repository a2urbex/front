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
        loading: false,
        friends : []
    }),
    actions: {
        async getSummary() {
            this.loading = true; 
            try {
                const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/summary`);
                this.favoriteList = data || [];
            } catch (error) {
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async getList() {
            this.loading = true; 
            try {
                const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}`);
                this.locationsList = data || [];
            } catch (error) {
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async getFavorites(id) {
            this.loading = true;
            try {
                const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}`);
                this.locationsListItems = {
                    name: data.name || '',
                    list: data.list || []
                };
                console.log(this.locationsListItems)
            } catch (error) {
                console.error('Error fetching favorites:', error);
            } finally {
                this.loading = false;
            }
        },    
        
        async createNewList(name, locationId){
            try {
                await request('POST', `${import.meta.env.VITE_FAVORITES_ENDPOINT}`,  { name, locationId });
                toast.success('Favorite list created and updated!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async addLocation(id, list){
            try {
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${list}/location/${id}`);
                toast.success('Favorite list updated!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async getUserInList(list, search) {
            try {
                const data = await request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${list}/search?string=${search}`);
                this.friends = data;
            } catch (error) {
                throw error;
            }
        },

        async addUserInlist(list, userId){
            try {
                console.log('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${list}/user/${userId}`)
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${list}/user/${userId}`);
                toast.success('Successfully added user!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
                this.getList();
                this.getUserInList(list, '');
            } catch (error) {
                throw error;
            }
        },

        async updateVisibility(id){
            try {
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}/disable`);
                await this.getList();  // Ensure that the list is updated after visibility change
                toast.success('Successfully updated visibility!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async updatePrivacy(id){
            try {
                await request('PUT', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}/share`);
                await this.getList();  // Ensure that the list is updated after privacy change
                toast.success('Successfully updated privacy!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async deleteList(id){
            try {
                await request('DELETE', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${id}`);
                await this.getList();  // Ensure that the list is updated after deletion
                toast.success('List successfully deleted!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        }
    }
});
