<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
    location: Object,
});

const emit = defineEmits(['open-location']);
const imageError = ref(false);
const imageLoading = ref(true);

const truncatedName = computed(() => {
    const maxLength = 35;
    if (props.location.name && props.location.name.length > maxLength) {
        return props.location.name.slice(0, maxLength) + '...';
    } 
    return props.location.name;
});

const handleImageLoad = () => {
    imageLoading.value = false;
};

const handleImageError = () => {
    imageError.value = true;
    imageLoading.value = false;
};

const openLocationCardDisplay = () => {
    emit('open-location', props.location);
};
</script>

<template>
    <div class="location-card">
        <div class="location-card__top" @click="openLocationCardDisplay">
            <template v-if="!imageError && location.image || location.image_maps">
                <div v-if="imageLoading" class="skeleton" style="width: 100%; height: 100%;"></div>
                <img 
                    :src="location.image || location.image_maps" 
                    alt="Location image"
                    @error="handleImageError"
                    @load="handleImageLoad"
                    :style="{ display: imageLoading ? 'none' : 'block' }"
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
