<script setup>
import { computed } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import { toast } from 'vue3-toastify';

const favoritesStore = useFavoritesStore();

const props = defineProps({
    favorite: Object,
});

const truncatedName = computed(() => {
    const maxLength = 25;
    if (props.favorite.name && props.favorite.name.length > maxLength) {
        return props.favorite.name.slice(0, maxLength) + '...';
    } 
    return props.favorite.name;
});


// VISIBIITY
const visibilityIcon = computed(() => {
    return props.favorite && props.favorite.disabled === 1 ? 'eye' : 'eye-slash';
});

const updateVisibility = () => {
    if (props.favorite && props.favorite.id) {
        favoritesStore.updateVisibility(props.favorite.id);
    }
};

// PRIVACY
const privacyIcon = computed(() => {
    return props.favorite && props.favorite.share === 1 ? 'lock' : 'lock-open';
});

const updatePrivacy = () => {
    if (props.favorite && props.favorite.id) {
        favoritesStore.updatePrivacy(props.favorite.id);
    }
};


// COPY LINK
const copyLink = () => {
    if (props.favorite && props.favorite.id) {
        const url = `${window.location.origin}/favorites/${props.favorite.id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied to clipboard!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        }).catch(err => {
            toast.error('Failed to copy link', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        });
    }
};

// DELETE
const deleteFavorite = () => {
    if (props.favorite && props.favorite.id) {
        favoritesStore.deleteList(props.favorite.id);
    }
};

</script>

<template>
    <div class="favorites-list-editor">
        <router-link :to="`/favorites/${favorite.id}`"><h2>{{truncatedName}}</h2></router-link>
        <router-link class="favorites-list-editor__link" :to="`/favorites/${favorite.id}`"><font-awesome-icon :icon="['fas', 'fa-arrow-up-right-from-square']" /></router-link>
        <div class="favorites-list-editor__actions">
           <button class="icon icon-visibility" @click="updateVisibility"><font-awesome-icon :icon="['fas', visibilityIcon]"/></button>
           <button class="icon icon-open" @click="updatePrivacy"><font-awesome-icon :icon="['fas', privacyIcon]"/></button>
           <button class="icon icon-share"><font-awesome-icon :icon="['fas', 'user-plus']" /></button>
           <button class="icon icon-copy-link" @click="copyLink"><font-awesome-icon :icon="['fas', 'link']"/></button>
           <span></span>
           <button class="icon icon-delete action-delete" @click="deleteFavorite"><font-awesome-icon :icon="['fas', 'trash']" /></button>
        </div>
    </div>
</template>

<style lang="scss">
@import '@/assets/styles/components/favoritesListEditor.scss';
</style>
