<template>
    <div class="location-card">
        <div class="location-card__top">
            <img :src="location.image" alt="Location image">
            <!-- Use the truncated name here -->
            <h2>{{ truncatedName }}</h2>
        </div>
        <div class="location-card__bottom">
            <a class="location-card__bottom-icon icon icon-earth" target="_blank" :href="googleMapsUrl">
                <font-awesome-icon :icon="['fas', 'earth-europe']" />
            </a>
            <a class="location-card__bottom-icon icon icon-waze" target="_blank" :href="wazeUrl">
                <font-awesome-icon :icon="['fab', 'waze']" />
            </a>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    location: Object,
});

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
    } return props.location.lon + props.location.lat; 
});
</script>

<style lang="scss">
@import '../assets/styles/components/locationCard.scss';
</style>
