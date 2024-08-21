<script setup>
import { defineProps, computed } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';

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

</script>

<template>
    <div class="favorites-list-editor">
        <h2>{{truncatedName}}</h2>
        <router-link class="favorites-list-editor__link" :to="`/favorites/${favorite.id}`"><font-awesome-icon :icon="['fas', 'fa-arrow-up-right-from-square']" /></router-link>
        <div class="favorites-list-editor__actions">
           <button class="icon icon-visibility"><font-awesome-icon :icon="['fas', 'eye']" /></button>
           <button class="icon icon-open"><font-awesome-icon :icon="['fas', 'lock']" /></button>
           <button class="icon icon-share"><font-awesome-icon :icon="['fas', 'user-plus']" /></button>
           <button class="icon icon-copy-link"><font-awesome-icon :icon="['fas', 'link']" /></button>
           <span></span>
           <button class="icon icon-delete"><font-awesome-icon :icon="['fas', 'trash']" /></button>
        </div>
    </div>
</template>

<style lang="scss">
@import '@/assets/styles/components/favoritesListEditor.scss';
</style>
