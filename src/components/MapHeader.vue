<script setup>
import { useMapStore } from '@/stores/map';

const mapStore = useMapStore();
</script>

<template>
    <div class="map-header page-width d-none">
        <div class="map-header-item map-header__list" @click="mapStore.open = false" :class="{ active: !mapStore.open }">List</div>
        <div class="map-header-item map-header__map" @click="mapStore.open = true" :class="{ active: mapStore.open }">Map</div>
    </div>
</template>

<style lang="scss">
@use '../assets/styles/components/mapHeader.scss' as *;
</style>
