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
                const data = await request('GET', `${import.meta.env.VITE_FRIENDS_ENDPOINT}`);
                this.friendsList = data;
            } catch (error) {
                console.error('Failed to fetch friends :', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async removeFriend(id) {
            this.loading = true;
            try {
                await request('DELETE', `${import.meta.env.VITE_FRIENDS_ENDPOINT}/${id}`);
            } catch (error) {
                console.error('Failed to remove friend:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async addFriend(id) {
            this.loading = true;
            try {
                await request('POST', `${import.meta.env.VITE_FRIENDS_ENDPOINT}/${id}`);
            } catch (error) {
                console.error('Failed to add friend:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async cancelFriendRequest(id) {
            this.loading = true;
            try {
                await request('PUT', `${import.meta.env.VITE_FRIENDS_ENDPOINT}/${id}/cancel`);
            } catch (error) {
                console.error('Failed to cancel friend request:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async acceptFriendRequest(id) {
            this.loading = true;
            try {
                await request('PUT', `${import.meta.env.VITE_FRIENDS_ENDPOINT}/${id}/accept`);
            } catch (error) {
                console.error('Failed to accept friend request:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async rejectFriendRequest(id) {
            this.loading = true;
            try {
                await request('PUT', `${import.meta.env.VITE_FRIENDS_ENDPOINT}/${id}/decline`);
            } catch (error) {
                console.error('Failed to reject friend request:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async getProfile(id) {
            this.loading = true;
            try {
                const data = await request('GET', `${import.meta.env.VITE_PROFILE_ENDPOINT}/${id}`);
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
