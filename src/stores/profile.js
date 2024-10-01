import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useProfileStore = defineStore('profile', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        viewProfile: {},
        friendsList: {},
        loading: false
    }),
    actions: {
        async getFriends() {
            this.loading = true;
            try {
                console.log('GET', `${import.meta.env.VITE_FRIENDS_ENDPOINT}`, this)
                const data = await request('GET', `${import.meta.env.VITE_FRIENDS_ENDPOINT}`, this);
                this.friendsList = data;
                console.log('Friends List:', this.friendsList);
            } catch (error) {
                console.error('Failed to fetch friends :', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async getProfile(id) {
            this.loading = true;
            try {
                const data = await request('GET', `${import.meta.env.VITE_PROFILE_ENDPOINT}/${id}`, this);
                this.viewProfile = data;
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});
