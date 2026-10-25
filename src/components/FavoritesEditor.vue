<script setup>
import { ref } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import FavoritesFriend from './FavoriteFriend.vue';
import { toast } from 'vue3-toastify';

// Actions d'une liste, présentées en feuille d'actions iOS
const favoritesStore = useFavoritesStore();
const props = defineProps({ favorite: Object });
const emit = defineEmits(['close']);
const sharing = ref(false);
const confirmDelete = ref(false);
const TOAST = { position: toast.POSITION.TOP_CENTER, autoClose: 1200, theme: 'dark' };

const updateVisibility = async () => {
    await favoritesStore.updateVisibility(props.favorite.id);
    emit('close');
};
const updatePrivacy = async () => {
    await favoritesStore.updatePrivacy(props.favorite.id);
    emit('close');
};
const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/favorites/${props.favorite.id}`)
        .then(() => toast.success('Link copied', TOAST))
        .catch(() => toast.error('Could not copy the link', TOAST));
    emit('close');
};
const deleteFavorite = async () => {
    if (!confirmDelete.value) {
        confirmDelete.value = true;
        return;
    }
    await favoritesStore.deleteList(props.favorite.id);
    emit('close');
};
</script>

<template>
    <div class="ios-action-sheet" role="dialog" :aria-label="`${favorite.name} actions`">
        <div class="ios-action-sheet__group">
            <p class="ios-action-sheet__title">{{ favorite.name }}</p>
            <template v-if="!sharing">
                <router-link class="ios-action-sheet__btn" :to="`/favorites/${favorite.id}`" @click="emit('close')"><font-awesome-icon :icon="['fas', 'arrow-right']" />Open list</router-link>
                <button class="ios-action-sheet__btn" @click="updateVisibility"><font-awesome-icon :icon="['fas', favorite.disabled === 1 ? 'eye' : 'eye-slash']" />{{ favorite.disabled === 1 ? 'Show list on the map' : 'Hide list from the map' }}</button>
                <template v-if="favorite.name !== 'like'">
                    <button class="ios-action-sheet__btn" @click="updatePrivacy"><font-awesome-icon :icon="['fas', favorite.share === 1 ? 'lock' : 'lock-open']" />{{ favorite.share === 1 ? 'Make private' : 'Allow sharing by link' }}</button>
                    <button class="ios-action-sheet__btn" @click="sharing = true"><font-awesome-icon :icon="['fas', 'user-plus']" />Share with a friend</button>
                    <button class="ios-action-sheet__btn" @click="copyLink"><font-awesome-icon :icon="['fas', 'link']" />Copy link</button>
                    <button class="ios-action-sheet__btn is-danger" @click="deleteFavorite"><font-awesome-icon :icon="['fas', 'trash']" />{{ confirmDelete ? 'Tap again to delete' : 'Delete list' }}</button>
                </template>
            </template>
            <div v-else class="ios-action-sheet__share">
                <FavoritesFriend :favorite="favorite" />
            </div>
        </div>
        <button class="ios-action-sheet__btn ios-action-sheet__cancel" @click="sharing ? (sharing = false) : emit('close')">{{ sharing ? 'Back' : 'Cancel' }}</button>
    </div>
</template>
