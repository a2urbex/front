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

const isFavorite = computed(() => Array.isArray(props.location?.fids) && props.location.fids.length > 0);

const contributor = computed(() => {
    if (props.location?.userId && props.location?.userUsername) {
        return {
            name: props.location.userUsername,
            image: props.location.userImage || '/default-user.png',
            isUser: true,
        };
    }
    return { name: 'A2urbex', image: '/logox192.png', isUser: false };
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
    <div class="location-card" :class="{ 'is-favorite': isFavorite }">
        <div class="location-card__top" @click="openLocationCardDisplay">
            <template v-if="!imageError && (location.image || location.image_maps)">
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

            <span v-if="location.categoryName" class="location-card__category">
                <font-awesome-icon :icon="['fas', 'font-awesome']" />
                {{ location.categoryName }}
            </span>

            <span class="location-card__contributor" :title="`Added by ${contributor.name}`">
                <img :src="contributor.image" :alt="contributor.name" />
            </span>

            <span v-if="isFavorite" class="location-card__favorite" aria-label="Favorite">
                <font-awesome-icon :icon="['fas', 'heart']" />
            </span>

            <div class="location-card__caption">
                <h2>{{ truncatedName }}</h2>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@use '../assets/styles/components/locationCard.scss' as *;
</style>
