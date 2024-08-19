import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
    }),
    actions: {
        async login(email, password, keepMeLoggedIn) {
            try {
                const data = await request('POST', `${import.meta.env.VITE_LOGIN_ENDPOINT}`, this, { email, password, keepMeLoggedIn });
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                toast.success('Login successful!', {position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark'});
            } catch (error) {
                throw error;
            }
        },

        async register(email, password, firstname, lastname) {
            try {
                const data = await request('POST', `${import.meta.env.VITE_REGISTER_ENDPOINT}`, this, { email, password, firstname, lastname });
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                toast.error( 'Registration successful!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            } catch (error) {
                throw error;
            }
        },

        async logout() {
            this.token = null;
            localStorage.removeItem('authToken');
            toast.warning('Logout successful!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark'});
        }
    }
});
