import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        userProfile: {}
    }),
    actions: {
        async login(email, password, keepMeLoggedIn) {
            try {
                const data = await request('POST', `${import.meta.env.VITE_LOGIN_ENDPOINT}`, this, { email, password, keepMeLoggedIn });
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                toast.success('Login successful!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
                await this.fetchUserProfile();
            } catch (error) {
                throw error;
            }
        },

        async register(email, password, firstname, lastname) {
            try {
                const data = await request('POST', `${import.meta.env.VITE_REGISTER_ENDPOINT}`, this, { email, password, firstname, lastname });
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                toast.success('Registration successful!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async forgotPassword(email) {
            try {
                await request('POST', `${import.meta.env.VITE_PASSWORD_FORGOT}`, { email });
                toast.success('Password reset email sent!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                console.log(error);
                throw error;
            }
        },

        async logout() {
            this.token = null;
            this.userProfile = {};
            toast.warning('Logout successful!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            localStorage.removeItem('authToken');
        },

        async validateToken() {
            try {
                await request('GET', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}`, this);
                return true;
            } catch (error) {
                this.logout();
                return false;
            }
        },

        async fetchUserProfile() {
            try {
                const data = await request('GET', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}`, this);
                this.userProfile = data;
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                throw error;
            }
        },

        async getSelf() {
            return this.userProfile;
        }
    }
});
