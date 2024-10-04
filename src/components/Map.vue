<script setup>
import { watch } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()

import { useMapStore } from '@/stores/map';
const mapStore = useMapStore();

const apiKey = import.meta.env.VITE_MAPS_KEY;
const center = { lat: 46.71109, lng: 1.7191036 };
const zoom = 6;

watch(() => route.fullPath, async () => {
  mapStore.open = false
}) 

watch(() => mapStore.open, async (newOpen, oldOpen) => {
  console.log(newOpen)
  console.log(mapStore.type, mapStore.typeId)
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
