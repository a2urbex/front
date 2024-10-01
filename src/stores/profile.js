import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useProfileStore = defineStore('profile', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        viewProfile: {},
        loading: false
    }),
    actions: {
        async getProfile(id) {
            this.loading = true;
            try {
                const data = await request('GET', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}/${id}`, this);
                this.viewProfile = data;
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});
