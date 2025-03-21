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
        async updateRoles(id, rolesData) {
            this.loading = true;
            try {
                await request('PUT', `${import.meta.env.VITE_USERS_ENDPOINT}/${id}/roles`, rolesData);
                this.getAll();
            } catch (error) {
                console.error('Failed to update roles :', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async deleteUser(id) {
            this.loading = true;
            try {
                await request('DELETE', `${import.meta.env.VITE_USERS_ENDPOINT}/${id}`);
                this.getAll();
            } catch (error) {
                console.error('Failed to delete user :', error);
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});
