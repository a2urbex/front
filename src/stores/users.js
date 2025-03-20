import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useUsersStore = defineStore('Users', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        users: [],
        loading: false
    }),
    actions: {
        async getAll() {
            this.loading = true;
            try {
                const data = await request('GET', `${import.meta.env.VITE_USERS_ENDPOINT}`);
                this.users = data;
            } catch (error) {
                console.error('Failed to fetch users :', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async updateRole(id, role) {
           // TODO
        }
    }
});
