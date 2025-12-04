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

const passwordData = ref({
    password: '',
    newPassword: '',
    confirmPassword: ''
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

            <div class="st-form-group">
                <textarea v-model="formData.about" rows="4" placeholder=" " id="about"></textarea>
                <label for="about">About</label>
                <div class="input-line"></div>
            </div>

            <div class="social-links">
                <div class="st-form-group">
                    <input type="text" v-model="formData.youtube" placeholder=" " id="youtube">
                    <label for="youtube">YouTube</label>
                    <div class="input-line"></div>
                    <font-awesome-icon :icon="['fas', 'globe']" class="input-icon" />
                </div>

                <div class="st-form-group">
                    <input type="text" v-model="formData.tiktok" placeholder=" " id="tiktok">
                    <label for="tiktok">TikTok</label>
                    <div class="input-line"></div>
                    <font-awesome-icon :icon="['fas', 'at']" class="input-icon" />
                </div>

                <div class="st-form-group">
                    <input type="text" v-model="formData.instagram" placeholder=" " id="instagram">
                    <label for="instagram">Instagram</label>
                    <div class="input-line"></div>
                    <font-awesome-icon :icon="['fas', 'at']" class="input-icon" />
                </div>
            </div>

            <div class="password-section">
                <h3>Change Password</h3>
                <div class="st-form-group">
                    <input type="password" v-model="passwordData.password" placeholder=" " id="current-password">
                    <label for="current-password">Current Password</label>
                    <div class="input-line"></div>
                    <font-awesome-icon :icon="['fas', 'lock']" class="input-icon" />
                </div>

                <div class="st-form-group">
                    <input type="password" v-model="passwordData.newPassword" placeholder=" " id="new-password">
                    <label for="new-password">New Password</label>
                    <div class="input-line"></div>
                    <font-awesome-icon :icon="['fas', 'lock']" class="input-icon" />
                </div>

                <div class="st-form-group">
                    <input type="password" v-model="passwordData.confirmPassword" placeholder=" " id="confirm-password">
                    <label for="confirm-password">Confirm New Password</label>
                    <div class="input-line"></div>
                    <font-awesome-icon :icon="['fas', 'lock']" class="input-icon" />
                </div>
            </div>

            <div class="form-group privacy-setting">
                <label class="checkbox-label">
                    <span>Private Profile</span>
                    <div class="toggle-switch">
                        <input type="checkbox" v-model="formData.isPrivate" :checked="formData.isPrivate">
                        <span class="slider"></span>
                    </div>
                </label>
            </div>

            <button type="submit" class="st-btn" :disabled="editProfileStore.loading">
                <span>{{ editProfileStore.loading ? 'Saving...' : 'Save Changes' }}</span>
                <div class="btn-glow"></div>
            </button>
        </form>
    </div>
</template>

<style lang="scss" scoped>
    @use '@/assets/styles/components/editProfile.scss' as *;
</style>