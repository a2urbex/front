<script setup>
import Title from '@/components/Title.vue';
import { apiImage } from '@/utilities/apiImage';
import { ref, onMounted } from 'vue';
import { useEditProfileStore } from '@/stores/editProfile';
import { useProfileStore } from '@/stores/profile';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue3-toastify';

const editProfileStore = useEditProfileStore();
const profileStore = useProfileStore();
const authStore = useAuthStore();

const formData = ref({
    about: '',
    youtube: '',
    tiktok: '',
    instagram: '',
    isPrivate: false,
    image: null,
    banner: null
});

const passwordData = ref({
    password: '',
    newPassword: '',
    confirmPassword: ''
});

const imagePreview = ref(null);
const username = ref('');
const bannerPreview = ref(null);

onMounted(async () => {
    const user = await authStore.getSelf();
    await profileStore.getProfile(user.id);
    const profile = profileStore.viewProfile;
    
    formData.value = {
        about: profile.about || '',
        youtube: profile.youtube || '',
        tiktok: profile.tiktok || '',
        instagram: profile.instagram || '',
        isPrivate: profile.isPrivate || false,
        image: null,
        banner: null
    };
    if (profile.image) imagePreview.value = apiImage(profile.image);
    if (profile.banner) bannerPreview.value = apiImage(profile.banner);
    username.value = profile.username || user.username || '';
});

const handleImageChange = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file', { 
            position: toast.POSITION.TOP_CENTER,
            theme: 'dark'
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        if (type === 'profile') {
            formData.value.image = file;
            imagePreview.value = e.target.result;
        } else {
            formData.value.banner = file;
            bannerPreview.value = e.target.result;
        }
    };
    reader.readAsDataURL(file);
};

const handleSubmit = async () => {
    try {
        // Update profile information
        await editProfileStore.updateProfile(formData.value);

        // Change password if provided
        if (passwordData.value.password || passwordData.value.newPassword || passwordData.value.confirmPassword) {
            // Validate password change
            if (!passwordData.value.password) {
                toast.error('Current password is required', {
                    position: toast.POSITION.TOP_CENTER,
                    theme: 'dark'
                });
                return;
            }
            if (!passwordData.value.newPassword) {
                toast.error('New password is required', {
                    position: toast.POSITION.TOP_CENTER,
                    theme: 'dark'
                });
                return;
            }
            if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
                toast.error('New passwords do not match', {
                    position: toast.POSITION.TOP_CENTER,
                    theme: 'dark'
                });
                return;
            }

            await editProfileStore.changePassword({
                password: passwordData.value.password,
                newPassword: passwordData.value.newPassword
            });

            // Clear password fields after successful change
            passwordData.value = {
                password: '',
                newPassword: '',
                confirmPassword: ''
            };
        }

        await authStore.fetchUserProfile();
        toast.success('Saved', { position: toast.POSITION.TOP_CENTER, autoClose: 1200, theme: 'dark' });
    } catch (error) {
        console.error('Error updating profile:', error);
    }
};
</script>

<template>
    <Title title="Account settings" />

    <form class="ios-page account-page" @submit.prevent="handleSubmit">
        <!-- En-tête : couverture + photo, chacune remplaçable d'un tap -->
        <div class="account-hero">
            <label class="account-hero__cover" :style="{ backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none' }">
                <input type="file" accept="image/*" @change="(e) => handleImageChange(e, 'banner')" aria-label="Change cover image" />
                <span class="account-hero__edit"><font-awesome-icon :icon="['fas', 'pencil']" />Cover</span>
            </label>
            <label class="account-hero__avatar" :style="{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none' }">
                <input type="file" accept="image/*" @change="(e) => handleImageChange(e, 'profile')" aria-label="Change profile photo" />
                <span v-if="!imagePreview" class="account-hero__initials">{{ (username || '?').slice(0, 2).toUpperCase() }}</span>
                <span class="account-hero__badge"><font-awesome-icon :icon="['fas', 'pencil']" /></span>
            </label>
            <p class="account-hero__name">{{ username }}</p>
        </div>

        <section class="ios-section">
            <h3 class="ios-header">About</h3>
            <div class="ios-group">
                <textarea id="about" v-model="formData.about" class="ios-field__area" rows="4" placeholder="A few words about you"></textarea>
            </div>
        </section>

        <section class="ios-section">
            <h3 class="ios-header">Social</h3>
            <div class="ios-group">
                <label class="ios-row ios-field" for="youtube"><span class="ios-field__label">YouTube</span><input id="youtube" v-model="formData.youtube" type="text" placeholder="Channel link" autocomplete="off" /></label>
                <label class="ios-row ios-field" for="tiktok"><span class="ios-field__label">TikTok</span><input id="tiktok" v-model="formData.tiktok" type="text" placeholder="@username" autocomplete="off" /></label>
                <label class="ios-row ios-field" for="instagram"><span class="ios-field__label">Instagram</span><input id="instagram" v-model="formData.instagram" type="text" placeholder="@username" autocomplete="off" /></label>
            </div>
        </section>

        <section class="ios-section">
            <h3 class="ios-header">Privacy</h3>
            <div class="ios-group">
                <button type="button" class="ios-row" role="switch" :aria-checked="!!formData.isPrivate" @click="formData.isPrivate = !formData.isPrivate">
                    <span class="ios-icon"><font-awesome-icon :icon="['fas', 'lock']" /></span>
                    <span class="ios-row__label">Private profile</span>
                    <span class="ios-switch" :class="{ on: formData.isPrivate }"></span>
                </button>
            </div>
            <p class="ios-footer">Only your friends can see a private profile.</p>
        </section>

        <section class="ios-section">
            <h3 class="ios-header">Change password</h3>
            <div class="ios-group">
                <label class="ios-row ios-field" for="current-password"><span class="ios-field__label">Current</span><input id="current-password" v-model="passwordData.password" type="password" placeholder="Required" autocomplete="current-password" /></label>
                <label class="ios-row ios-field" for="new-password"><span class="ios-field__label">New</span><input id="new-password" v-model="passwordData.newPassword" type="password" placeholder="New password" autocomplete="new-password" /></label>
                <label class="ios-row ios-field" for="confirm-password"><span class="ios-field__label">Confirm</span><input id="confirm-password" v-model="passwordData.confirmPassword" type="password" placeholder="Repeat it" autocomplete="new-password" /></label>
            </div>
            <p class="ios-footer">Leave empty to keep your current password.</p>
        </section>

        <button type="submit" class="ios-primary" :disabled="editProfileStore.loading">{{ editProfileStore.loading ? 'Saving…' : 'Save changes' }}</button>
    </form>
</template>
