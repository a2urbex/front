import { defineStore } from 'pinia';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';

export const useEditProfileStore = defineStore('editProfile', {
    state: () => ({
        loading: false,
        userProfile: {
            about: '',
            youtube: '',
            tiktok: '',
            instagram: '',
            isPrivate: false,
            image: null,
            banner: null
        }
    }),
    actions: {
        async updateProfile(profileData) {
            this.loading = true;
            console.log(profileData);
            try {
                await request('PUT', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}`, profileData);
                toast.success('Profile updated successfully!', { 
                    position: toast.POSITION.TOP_CENTER, 
                    autoClose: 1000, 
                    pauseOnHover: true, 
                    theme: 'dark' 
                });
            } catch (error) {
                console.error('Failed to update profile:', error);
                toast.error('Failed to update profile', { 
                    position: toast.POSITION.TOP_CENTER,
                    theme: 'dark'
                });
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});
