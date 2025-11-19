<script setup>
import { onMounted, computed, ref } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue3-toastify';

const locationStore = useLocationStore();
const authStore = useAuthStore();

const route = useRoute();
const id = route.params.id;

const isLoggedIn = computed(() => authStore.token !== null);
const location = computed(() => locationStore.location);
const imageError = ref(false);

import FavoritesModal from '@/components/FavoriteModal.vue';

onMounted(async () => {
  try {
    await locationStore.getLocation(id);
  } catch (error) {
  }
});

const handleImageError = () => {
    imageError.value = true;
};

const routePath = isLoggedIn.value ? '/locations' : '/';
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
</script>

<template> 
    <transition name="translate" mode="out-in" appear>
        <div class="location-card-display">
            <div class="location-card-display__container">
                <router-link class="close-button" :to="routePath">
                    <font-awesome-icon :icon="['fas', 'angle-left']" />
                </router-link>
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
                <div class="location-card-display__bottom">
                    <FavoritesModal :fids="location.fids" :id="location.id" />
                    <h2>{{ location.name }}</h2>
                    <p class="location-card-display__category">
                        <font-awesome-icon :icon="['fas', 'font-awesome']" />{{ location.categoryName ? location.categoryName : 'Unknown' }}
                    </p>
                    <a class="location-card__bottom-icon icon icon-earth" target="_blank" :href="`https://www.google.com/maps?t=k&q=${location.lat},${location.lon}`">
                        <font-awesome-icon :icon="['fas', 'earth-europe']" /> Open with Maps
                    </a>
                    <a class="location-card__bottom-icon icon icon-waze" target="_blank"  :href="`https://waze.com/ul?q=${location.lat},${location.lon}&navigate=yes&zoom=17`">
                        <font-awesome-icon :icon="['fab', 'waze']" /> Open with Waze
                    </a>
                </div> 
            </div>
        </div>
    </transition>
</template>
