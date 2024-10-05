<script setup>
import { computed } from 'vue';
import FavoritesModal from './FavoriteModal.vue';

const props = defineProps({
    location: Object,
});

const emit = defineEmits(['open-location']);

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

const openLocationCardDisplay = () => {
    emit('open-location', props.location);
};
</script>

<template>
    <div class="location-card">
        <FavoritesModal :fids="location.fids" :id="location.id" />
        <div class="location-card__top" @click="openLocationCardDisplay">
            <img :src="location.image" alt="Location image">
            <div class="location-card__top-overlay"></div>
            <h2>{{ truncatedName }}</h2>
        </div>
    </div>
</template>

<style lang="scss">
@import '../assets/styles/components/locationCard.scss';
</style>
