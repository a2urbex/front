<script setup>
import { computed, ref } from 'vue';
import ImagePlaceholder from './ImagePlaceholder.vue';
import { useRoute } from 'vue-router';
import { usePositionStore } from '@/stores/position';
import { useExplorationStore } from '@/stores/exploration';
import { statusEmoji } from '@/utilities/field';

const props = defineProps({
    location: Object,
    tall: { type: Boolean, default: false }, // quinconce : photo en portrait
});

const emit = defineEmits(['open-location']);
const route = useRoute();
const position = usePositionStore();
const exploration = useExplorationStore();
const distance = computed(() =>
    exploration.active && route.params.id === exploration.active.favoriteId ? position.labelTo(props.location) : '',
);
const imageError = ref(false);
const imageLoading = ref(true);


const isFavorite = computed(() => Array.isArray(props.location?.fids) && props.location.fids.length > 0);


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
    <!-- Carte de point : photo 4:3, puis nom et type dessous (pas de texte sur l'image) -->
    <div class="spot-card" :class="{ 'is-favorite': isFavorite, 'is-tall': tall }" role="button" tabindex="0" @click="openLocationCardDisplay" @keydown.enter="openLocationCardDisplay">
        <div class="spot-card__media">
            <template v-if="!imageError && (location.image || location.image_maps)">
                <div v-if="imageLoading" class="skeleton"></div>
                <img
                    :src="location.image || location.image_maps"
                    alt=""
                    loading="lazy"
                    @error="handleImageError"
                    @load="handleImageLoad"
                    :style="{ opacity: imageLoading ? 0 : 1 }"
                >
            </template>
            <span v-else class="spot-card__empty"><font-awesome-icon :icon="['fas', 'image']" /></span>

            <span v-if="statusEmoji(location)" class="spot-card__chip" :class="{ 'is-invalid': location.status === 'invalid' }">{{ statusEmoji(location) }}{{ location.danger ? '⚠️' : '' }}</span>
            <span v-if="isFavorite" class="spot-card__fav" aria-label="Saved"><font-awesome-icon :icon="['fas', 'heart']" /></span>
            <span v-if="distance" class="spot-card__dist">{{ distance }}</span>
            <span v-else-if="location.fake" class="spot-card__demo">Demo</span>
        </div>
        <div class="spot-card__text">
            <b>{{ location.name || 'Unnamed spot' }}</b>
            <small v-if="location.categoryName">{{ location.categoryName }}</small>
        </div>
    </div>
</template>

<style lang="scss">
@use '../assets/styles/components/spotCard.scss' as *;
</style>
