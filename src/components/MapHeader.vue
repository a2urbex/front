<script setup>
import { useMapStore } from '@/stores/map';
import { useFilterUIStore } from '@/stores/filterUI';

// Bascule Carte / Liste (mobile) : une pilule flottante au-dessus de la barre d'onglets, la même sur les deux vues
const mapStore = useMapStore();
const filterUI = useFilterUIStore();
</script>

<template>
    <Teleport to="body">
        <button v-if="!filterUI.showContent" class="view-toggle d-none" @click="mapStore.open = !mapStore.open" :aria-label="mapStore.open ? 'Show as list' : 'Show on map'">
            <font-awesome-icon :icon="['fas', mapStore.open ? 'list-ul' : 'map-location-dot']" />
            {{ mapStore.open ? 'List' : 'Map' }}
        </button>
    </Teleport>
</template>
