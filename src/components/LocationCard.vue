<script setup>
import { computed, ref } from 'vue';
import FavoritesModal from './FavoriteModal.vue';

const props = defineProps({
    location: Object,
});

const emit = defineEmits(['open-location']);
const imageError = ref(false);

const googleMapsUrl = computed(() => {
    return `https://www.google.com/maps?t=k&q=${props.location.lat},${props.location.lon}`;
});

const wazeUrl = computed(() => {
    return `https://waze.com/ul?q=${props.location.lat},${props.location.lon}&navigate=yes&zoom=17`;
});

const truncatedName = computed(() => {
    const maxLength = 35;
    if (props.location.name && props.location.name.length > maxLength) {
        return props.location.name.slice(0, maxLength) + '...';
    } 
    return props.location.name;
});

const handleImageError = () => {
    imageError.value = true;
};

const openLocationCardDisplay = () => {
    emit('open-location', props.location);
};
</script>

<template>
    <div class="location-card">
        <FavoritesModal :fids="location.fids" :id="location.id" />
        <div class="location-card__top" @click="openLocationCardDisplay">
            <template v-if="!imageError && location.image">
                <img 
                    :src="location.image" 
                    alt="Location image"
                    @error="handleImageError"
                >
            </template>
            <p v-else class="image-error">😭 Image not available</p>
            <div class="location-card__top-overlay"></div>
            <h2>{{ truncatedName }}</h2>
        </div>
    </div>
</template>

<style lang="scss">
@import '../assets/styles/components/locationCard.scss';
</style>
