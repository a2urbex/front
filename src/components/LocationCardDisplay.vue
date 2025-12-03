<script setup>
import { computed, ref } from 'vue';
import { toast } from 'vue3-toastify';
import { useAuthStore } from '@/stores/auth';
import FavoritesModal from './FavoriteModal.vue';
import LocationEdit from './LocationEdit.vue';
const props = defineProps({
    location: Object
});

const imageError = ref(false);
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.userProfile?.isAdmin || false);
const userId = computed(() => authStore.userProfile?.id || null);

// COPY LINK
const copyLink = (id) => {
    if (id) {
        const url = `${window.location.origin}/location/${id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied to clipboard!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        }).catch(err => {
            toast.error('Failed to copy link', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        });
    }
};

const handleImageError = () => {
    imageError.value = true;
};

const googleMapsUrl = computed(() => {
    return `https://www.google.com/maps?t=k&q=${props.location.lat},${props.location.lon}`;
});

const wazeUrl = computed(() => {
    return `https://waze.com/ul?q=${props.location.lat},${props.location.lon}&navigate=yes&zoom=17`;
});
</script>

<template>
    <div v-if="location">
        <transition name="translate" mode="out-in" appear>
            <div class="location-card-display">
                <div class="location-card-display__container">
                    <button class="close-button" @click="$emit('close')">
                        <font-awesome-icon :icon="['fas', 'angle-left']" />
                    </button>
                    <button class="share-button" @click="copyLink(location.id)">
                        <font-awesome-icon :icon="['fa', 'share']" />
                    </button>
                    <template v-if="!imageError && location.image || location.image_maps">
                        <img 
                            :src="location.image || location.image_maps" 
                            alt="Location image"
                            @error="handleImageError"
                        >
                    </template>
                    <p v-else class="image-error">😭 Image not available</p>
                    <div class="location-card-display__bottom page-width">
                        <div class="location-card-display__bottom-actions">
                            <FavoritesModal :fids="location.fids" :id="location.id" />
                            <LocationEdit v-if="userId && (isAdmin || location.userId === userId)" :location="location" @close="$emit('close')" />
                        </div>

                        <h2>{{ location.name }}</h2>
                        <p class="location-card-display__category">
                            <font-awesome-icon :icon="['fas', 'font-awesome']" />{{ location.categoryName ? location.categoryName : 'Unknown' }}
                        </p>
                        <a class="location-card__bottom-icon icon icon-earth" target="_blank" :href="googleMapsUrl">
                            <font-awesome-icon :icon="['fas', 'earth-europe']" /> Open with Maps
                        </a>
                        <a class="location-card__bottom-icon icon icon-waze" target="_blank" :href="wazeUrl">
                            <font-awesome-icon :icon="['fab', 'waze']" /> Open with Waze
                        </a>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style lang="scss">
@use '../assets/styles/components/locationCardDisplay.scss' as *;
</style>
