<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import FavoritesEditor from '@/components/FavoritesEditor.vue';
import { useFavoritesStore } from '@/stores/favorites';
import PreLoader from '../components/PreLoader.vue';
import Title from '@/components/Title.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const favoritesStore = useFavoritesStore();
const locationsList = computed(() => favoritesStore.locationsList);
const isLoading = computed(() => favoritesStore.loading);

const selectedLocationId = ref(null); 
const activeFavoriteId = ref(null); 

const selectLocation = (locationId) => {
    selectedLocationId.value = locationId;
};

const setActiveFavorite = (favoriteId) => {
    activeFavoriteId.value = favoriteId;
};

const removeActiveFavorite = () => {
    activeFavoriteId.value = null;
};

const handleClickOutside = (event) => {
    const activeEntry = document.querySelector('.favorites__entry.active');
    const selectedEntry = document.querySelector('.favorites__entry-selected');

    // Remove active state if clicked outside the active entry
    if (activeEntry && !activeEntry.contains(event.target)) {
        removeActiveFavorite(); 
    }

    // Remove selected state if clicked outside the selected entry
    if (selectedEntry && !selectedEntry.contains(event.target)) {
        selectedLocationId.value = null;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Fetch list on component mount
onMounted(async () => {
    await favoritesStore.getList();
});
</script>

<template>
    <Title title="Favorites" />
    <transition name="fade" mode="out-in">
        <PreLoader msg="Favorites" v-if="isLoading" key="preloader" /> 
    </transition>
    
    <div class="favorites__container">
        <div class="favorites page-width">
            <div class="favorites__entry" 
                v-for="(favorite) in locationsList" 
                :key="favorite.id"
                :class="{ 'favorites__entry-selected': favorite.id === selectedLocationId, 'active': favorite.id === activeFavoriteId }"
                @click="selectLocation(favorite.id)">
                <div class="favorites__content">
                    <h3>{{ favorite.name }}</h3>
                    <p>{{ favorite.count }} location(s)</p>
                    <div class="favorites__content-users">
                        <div class="favorites__content-users-entry" v-for="(user) in favorite.users" :key="user.id">
                            <img v-if="user.image" :src="`${API_BASE_URL}/${user.image}`" :alt="user.name">
                        </div>
                    </div>
                    <div class="favorites__content-edit">                        
                        <FavoritesEditor :favorite="favorite" @set-active="setActiveFavorite" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@import '@/assets/styles/components/favoritesList.scss';
</style>
