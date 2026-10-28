<script setup>
import { isDemo } from '@/demo/session';
const demo = isDemo();
import { computed, ref } from 'vue';
import { apiImage } from '@/utilities/apiImage';
import { toast } from 'vue3-toastify';
import { useAuthStore } from '@/stores/auth';
import { useLocationStore } from '@/stores/location';
import { useFavoritesStore } from '@/stores/favorites';
import FavoritesModal from './FavoriteModal.vue';
import LocationEdit from './LocationEdit.vue';
import UserRoleBadge from './UserRoleBadge.vue';
import ImagePlaceholder from './ImagePlaceholder.vue';
import FieldStatus from './FieldStatus.vue';
import ImageSlider from './ImageSlider.vue';
import { usePositionStore } from '@/stores/position';
const props = defineProps({
    location: Object
});

const imageError = ref(false);
const avatarBroken = ref(false);
const position = usePositionStore();
// Statut terrain : l'objet vient de la liste du store, on le met à jour en place
const emit = defineEmits(['close', 'deleted', 'status-updated']);
const onStatusUpdated = (updated) => {
    Object.assign(props.location, updated);
    emit('status-updated', { ...props.location });
};
// Point masqué (« Bullshit ») : on le retire des listes affichées et on ferme la fiche
const locationStore = useLocationStore();
const favoritesStore = useFavoritesStore();
const onRemoved = (id) => {
    locationStore.locationsList = (locationStore.locationsList || []).filter((l) => l.id !== id);
    const items = favoritesStore.locationsListItems;
    if (Array.isArray(items?.list)) items.list = items.list.filter((l) => l.id !== id);
    emit('deleted', id);
    emit('close');
};
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

// Tuiles Save / More : un tap n'importe où sur la tuile déclenche son bouton (pas seulement sur l'icône)
const SLOT_TRIGGER = '.favorite-modal__trigger, .location-edit-trigger';
const tapSlot = (e) => {
    if (e.target.closest(SLOT_TRIGGER)) return; // tap direct sur le bouton : il gère déjà
    e.currentTarget.querySelector(SLOT_TRIGGER)?.click();
};

const handleImageError = () => {
    imageError.value = true;
};

const canEdit = computed(() => !demo && userId.value && (isAdmin.value || props.location.userId === userId.value));
const coords = computed(() => `${Number(props.location.lat).toFixed(5)}, ${Number(props.location.lon).toFixed(5)}`);
// Itinéraire : Plans sur iPhone/iPad/Mac, Google Maps ailleurs
const isApple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
const directionsUrl = computed(() => isApple
    ? `https://maps.apple.com/?daddr=${props.location.lat},${props.location.lon}`
    : `https://www.google.com/maps/dir/?api=1&destination=${props.location.lat},${props.location.lon}`);
const copyCoords = () => {
    navigator.clipboard?.writeText(coords.value).then(() => toast.success('Coordinates copied', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, theme: 'dark' })).catch(() => {});
};

const googleMapsUrl = computed(() => {
    return `https://www.google.com/maps?t=k&q=${props.location.lat},${props.location.lon}`;
});

const wazeUrl = computed(() => {
    return `https://waze.com/ul?q=${props.location.lat},${props.location.lon}&navigate=yes&zoom=17`;
});

const contributor = computed(() => {
    if (props.location?.userId && props.location?.userUsername) {
        return {
            name: props.location.userUsername,
            image: apiImage(props.location.userImage),
            isUser: true,
        };
    }
    return {
        name: 'A2urbex',
        image: '/logox192.png',
        isUser: false,
    };
});
</script>

<template>
    <!-- Monté dans <body> partout (carte et listes) : dans .content, le défilement de la page volait le geste « glisser pour fermer » -->
    <Teleport to="body">
    <div v-if="location">
        <div class="ld-backdrop" @click="$emit('close')"></div>
        <transition name="translate" mode="out-in" appear>
            <div class="location-card-display ld" v-swipe-close="() => $emit('close')">
                <span class="ld-grabber"></span>
                <div class="ld-media">
                    <!-- Photo + vue Google Maps : défilables quand les deux existent -->
                    <div v-if="location.image && location.image_maps" class="location-card-display__slider">
                        <ImageSlider :images="[location.image, location.image_maps]" />
                    </div>
                    <img v-else-if="!imageError && (location.image || location.image_maps)" :src="location.image || location.image_maps" alt="" @error="handleImageError">
                    <ImagePlaceholder v-else />
                    <div class="ld-media__buttons">
                        <button class="ld-round" @click="copyLink(location.id)" aria-label="Copy link"><font-awesome-icon :icon="['fas', 'arrow-up-from-bracket']" /></button>
                        <button class="ld-round" @click="$emit('close')" aria-label="Close"><font-awesome-icon :icon="['fas', 'xmark']" /></button>
                    </div>
                </div>

                <div class="ld-body">
                    <header class="ld-head">
                        <p class="location-card-display__fake" v-if="location.fake">Demo data · this place does not exist</p>
                        <h2>{{ location.name || 'Unnamed spot' }}</h2>
                        <p class="ld-sub">
                            <span class="ld-sub__type">{{ location.categoryName ? location.categoryName : 'Unknown type' }}</span>
                            <template v-if="position.pos"> · {{ position.labelTo(location) }} away</template>
                        </p>
                    </header>

                    <div class="ld-actions">
                        <a class="ld-action ld-action--primary" :href="directionsUrl" target="_blank" rel="noopener">
                            <font-awesome-icon :icon="['fas', 'diamond-turn-right']" /><span>Directions</span>
                        </a>
                        <a class="ld-action" :href="wazeUrl" target="_blank" rel="noopener">
                            <font-awesome-icon :icon="['fab', 'waze']" /><span>Waze</span>
                        </a>
                        <div v-if="userId" class="ld-action ld-action--slot" @click="tapSlot"><FavoritesModal :fids="location.fids" :id="location.id" /><span>Save</span></div>
                        <div v-if="canEdit" class="ld-action ld-action--slot" @click="tapSlot"><LocationEdit :location="location" @close="$emit('close')" @deleted="(id) => $emit('deleted', id)" /><span>More</span></div>
                        <button v-else class="ld-action" @click="copyLink(location.id)"><font-awesome-icon :icon="['fas', 'link']" /><span>Link</span></button>
                    </div>

                    <FieldStatus v-if="userId" :key="location.id" :item="location" @updated="onStatusUpdated" @removed="onRemoved" />

                    <div class="ios-group">
                        <router-link v-if="contributor.isUser && userId" :to="`/profile/${location.userId}`" class="ios-row" @click="$emit('close')">
                            <img v-if="contributor.image && !avatarBroken" :src="contributor.image" alt="" class="ld-avatar" @error="avatarBroken = true" />
                            <span v-else class="ld-avatar ld-avatar--initials">{{ (contributor.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() }}</span>
                            <span class="ios-row__label">Added by</span>
                            <span class="ios-row__value">{{ contributor.name }}</span>
                            <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
                        </router-link>
                        <div v-else class="ios-row">
                            <img v-if="contributor.image && !avatarBroken" :src="contributor.image" alt="" class="ld-avatar" @error="avatarBroken = true" />
                            <span v-else class="ld-avatar ld-avatar--initials">{{ (contributor.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() }}</span>
                            <span class="ios-row__label">Added by</span>
                            <span class="ios-row__value">{{ contributor.name }}</span>
                        </div>
                        <button class="ios-row" @click="copyCoords">
                            <span class="ld-row-icon"><font-awesome-icon :icon="['fas', 'location-dot']" /></span>
                            <span class="ios-row__label">Coordinates</span>
                            <span class="ios-row__value ld-mono">{{ coords }}</span>
                        </button>
                        <a class="ios-row" :href="googleMapsUrl" target="_blank" rel="noopener">
                            <span class="ld-row-icon"><font-awesome-icon :icon="['fas', 'earth-europe']" /></span>
                            <span class="ios-row__label">Satellite view</span>
                            <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </transition>
    </div>
    </Teleport>
</template>

<style lang="scss">
@use '../assets/styles/components/locationCardDisplay.scss' as *;
</style>
