<script setup>
import Title from '@/components/Title.vue';
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

const imagePreview = ref(null);
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
    if (profile.image) imagePreview.value = profile.image;
    if (profile.banner) bannerPreview.value = profile.banner;
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
            formData.value.image = e.target.result;
            imagePreview.value = e.target.result;
        } else {
            formData.value.banner = e.target.result;
            bannerPreview.value = e.target.result;
        }
    };
    reader.readAsDataURL(file);
};

const handleSubmit = async () => {
    try {
        await editProfileStore.updateProfile(formData.value);
        await authStore.fetchUserProfile();
    } catch (error) {
        console.error('Error updating profile:', error);
    }
};
</script>

<template>
    <Title title="Account Settings" />

    <div class="edit-profile page-width">
        <form @submit.prevent="handleSubmit" class="edit-profile-form">
            <div class="image-uploads">
                <div class="upload-section banner-image">
                    <label>Banner Image</label>
                    <font-awesome-icon :icon="['fas', 'pen-to-square']" />
                    <div class="preview banner" :style="{ backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none' }">
                        <input type="file" @change="(e) => handleImageChange(e, 'banner')" accept="image/*">
                        <span v-if="!bannerPreview">Click to upload</span>
                    </div>
                </div>
                <div class="upload-section profile-image">
                    <label>Profile Image</label>
                    <font-awesome-icon :icon="['fas', 'pen-to-square']" />
                    <div class="preview" :style="{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none' }">
                        <input type="file" @change="(e) => handleImageChange(e, 'profile')" accept="image/*">
                        <span v-if="!imagePreview">Click to upload</span>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>About</label>
                <textarea v-model="formData.about" rows="4" placeholder="Tell us about yourself"></textarea>
            </div>

            <div class="social-links">
                <div class="form-group">
                    <label>YouTube</label>
                    <font-awesome-icon :icon="['fas', 'globe']" />
                    <input type="text" v-model="formData.youtube" placeholder="YouTube channel URL">
                </div>

                <div class="form-group">
                    <label>TikTok</label>
                    <font-awesome-icon :icon="['fas', 'at']" />
                    <input type="text" v-model="formData.tiktok" placeholder="example">
                </div>

                <div class="form-group">
                    <label>Instagram</label>
                    <font-awesome-icon :icon="['fas', 'at']" />
                    <input type="text" v-model="formData.instagram" placeholder="example">
                </div>
            </div>

            <div class="form-group privacy-setting">
                <label class="checkbox-label">
                    <input type="checkbox" v-model="formData.isPrivate">
                    Private Profile
                </label>
            </div>

            <button type="submit" class="submit-button" :disabled="editProfileStore.loading">
                {{ editProfileStore.loading ? 'Saving...' : 'Save Changes' }}
            </button>
        </form>
    </div>
</template>

<style scoped>
@import '@/assets/styles/components/editProfile.scss';
</style>