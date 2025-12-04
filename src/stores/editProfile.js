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
            try {
                const formData = new FormData();

                // Add all text fields
                if (profileData.about !== undefined) formData.append('about', profileData.about);
                if (profileData.youtube !== undefined) formData.append('youtube', profileData.youtube);
                if (profileData.tiktok !== undefined) formData.append('tiktok', profileData.tiktok);
                if (profileData.instagram !== undefined) formData.append('instagram', profileData.instagram);
                if (profileData.isPrivate !== undefined) formData.append('isPrivate', profileData.isPrivate.toString());

                // Handle image and banner files
                if (profileData.image instanceof File) {
                    formData.append('image', profileData.image);
                }
                if (profileData.banner instanceof File) {
                    formData.append('banner', profileData.banner);
                }

                await request('PUT', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

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
        },

        async changePassword(passwordData) {
            this.loading = true;
            try {
                await request('PUT', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}/password`, passwordData);

                toast.success('Password changed successfully!', {
                    position: toast.POSITION.TOP_CENTER,
                    autoClose: 1000,
                    pauseOnHover: true,
                    theme: 'dark'
                });
            } catch (error) {
                console.error('Failed to change password:', error);
                toast.error('Failed to change password', {
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
