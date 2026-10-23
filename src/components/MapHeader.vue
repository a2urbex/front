<script setup>
import { useMapStore } from '@/stores/map';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { addBodyClass, removeBodyClass } from '@/utilities/bodyClass';

// Sous-header List/Map sous un titre de page : décale le contenu d'autant
const root = ref(null);
let counted = false;
onMounted(() => {
  counted = !!root.value?.classList.contains('small-header');
  if (counted) addBodyClass('has-subheader');
});
onBeforeUnmount(() => { if (counted) removeBodyClass('has-subheader'); });

const mapStore = useMapStore();
</script>

<template>
    <div class="map-header page-width d-none" ref="root">
        <div class="map-header-item map-header__list" @click="mapStore.open = false" :class="{ active: !mapStore.open }">List</div>
        <div class="map-header-item map-header__map" @click="mapStore.open = true" :class="{ active: mapStore.open }">Map</div>
    </div>
</template>

<style lang="scss">
@use '../assets/styles/components/mapHeader.scss' as *;
</style>
