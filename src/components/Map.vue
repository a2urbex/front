<script setup>
import { onMounted, watch } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';

import { useMapStore } from '@/stores/map';

const mapStore = useMapStore();

const apiKey = import.meta.env.VITE_MAPS_KEY;
const center = { lat: 46.71109, lng: 1.7191036 };
const zoom = 6;

watch([mapStore.type, mapStore.typeId, mapStore.open], async ([newType, newTypeId, newOpen], []) => {
  console.log(newType, newTypeId, newOpen)
});

</script>

<template>
  <transition name="map" mode="out-in">
      <div id="map" v-if="mapStore.open">
        {{ mapStore.type }} {{ mapStore.typeId }}
        <GoogleMap :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="zoom" />
      </div>
  </transition>
</template>

<style lang="scss">
@import '../assets/styles/components/map.scss';
</style>
