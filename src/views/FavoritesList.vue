<script setup>
import { onMounted, ref, computed } from 'vue';
import FavoritesEditor from '@/components/FavoritesEditor.vue'
import { useFavoritesStore } from '@/stores/favorites';
import PreLoader from '../components/PreLoader.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const favoritesStore = useFavoritesStore();
const locationsList = computed(() => favoritesStore.locationsList);
const isLoading = computed(() => favoritesStore.loading);

const selectedLocationId = ref(null);

const selectLocation = (locationId) => {
    selectedLocationId.value = locationId;
};

onMounted(async () => {
    await favoritesStore.getList();
});
</script>

<template>
     <transition name="fade" mode="out-in">
        <PreLoader msg="Favorites" v-if="isLoading" key="preloader" /> 
    </transition>
    
    <div class="favorites__container">
        <h2>Favorites</h2>
        <div class="favorites page-width">
            <div class="favorites__entry" v-for="(favorite) in locationsList" :key="favorite.id"
                :class="{ 'favorites__entry-selected': favorite.id === selectedLocationId }"
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
                        <FavoritesEditor :favorite="favorite" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@import '@/assets/styles/components/favoritesList.scss';
</style>
