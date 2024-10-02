<script setup>
import { onMounted, computed } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// import PreLoader from '../components/PreLoader.vue';

const locationStore = useLocationStore();
const authStore = useAuthStore();

const route = useRoute();
const id = route.params.id;

// const isLoading = computed(() => locationStore.loading);
const isLoggedIn = computed(() => authStore.token !== null);
const location = computed(() => locationStore.location);
import FavoritesModal from '@/components/FavoriteModal.vue';


onMounted(async () => {
  try {
    await locationStore.getLocation(id);
  } catch (error) {
  }
});

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

const googleMapsUrl = computed(() => {
    return `https://www.google.com/maps?t=k&q=${location.lat},${location.lon}`;
});

const wazeUrl = computed(() => {
    return `https://waze.com/ul?q=${location.lat},${location.lon}&navigate=yes&zoom=17`;
});
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
                <img :src="location.image" alt="Location image">
                <div class="location-card-display__bottom">
                    <FavoritesModal/>
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
</template>
