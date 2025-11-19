import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        userProfile: {}
    }),
    actions: {
        async login(email, password, keepMeLoggedIn) {
            try {
                const data = await request('POST', `${import.meta.env.VITE_LOGIN_ENDPOINT}`, { email, password, keepMeLoggedIn });
                
                if (data.old) {
                    console.log('old');
                    toast.warning('Welcome to the brand-new a2urbex. You must reset your password to access the platform.', { 
                        position: toast.POSITION.TOP_CENTER, 
                        autoClose: 5000, 
                        pauseOnHover: true, 
                        theme: 'dark' 
                    });
                    setTimeout(() => {
                        router.push('/forgot-password');
                    }, 3000);
                    return;
                }else{
                    this.token = data.token;
                    localStorage.setItem('authToken', data.token);
                    toast.success('Login successful!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
                    await this.fetchUserProfile();
                    setTimeout(() => {
                        router.push('/locations');
                    }, 1500);
                }
            } catch (error) {
                throw error;
            }
        },

        async register(email, password, username) {
            try {
                const data = await request('POST', `${import.meta.env.VITE_REGISTER_ENDPOINT}`, { email, password, username });
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

        async resetPassword(token, password) {
            try {
                await request('POST', `${import.meta.env.VITE_PASSWORD_RESET}`, {token, password });
                toast.success('Password successfully updated!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
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

            setTimeout(() => {
                router.push('/');
              }, 1500);
        },

        async validateToken() {
            try {
                await request('GET', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}`);
                return true;
            } catch (error) {
                this.logout();
                return false;
            }
        },

        async fetchUserProfile() {
            try {
                const data = await request('GET', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}`);
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
