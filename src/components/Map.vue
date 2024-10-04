<script setup>
import { toRaw, watch } from 'vue';
import { GoogleMap, Marker, } from 'vue3-google-map';
import { useRoute } from 'vue-router';

const route = useRoute()

import { useMapStore } from '@/stores/map';
const mapStore = useMapStore();

const apiKey = import.meta.env.VITE_MAPS_KEY;
const center = { lat: 46.71109, lng: 1.7191036 };
const zoom = 6;
const markerOptions = { position: center, label: 'L', title: 'LADY LIBERTY' }
const pinOptions = { background: '#FBBC04' }

watch(() => route.fullPath, async () => {
  mapStore.open = false
  mapStore.locations = []
}) 

watch(() => mapStore.open, async (open) => {
  if(open) mapStore.getMapLocations();
});

const displayOverlay = (item) => {
  console.log(toRaw(item))
}

</script>

<template>
  <transition name="map" mode="out-in">
      <div id="map" v-if="mapStore.open">
        <GoogleMap :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="zoom">
          <Marker 
            v-for="item in mapStore.locations"
            @click="displayOverlay(item)"
            :options="{
              position: { lat: item.lat, lng: item.lon },
              title: item.name,
              zIndex: 2,
              icon: {
                url: `/pins/pin-${item.categoryIcon || 'default'}.png`,
                scaledSize: { height: 27, width: 20 },
                origin: { x: 0, y: 0 },
                anchor: { x: 10, y: 27 },
                zIndex: 2,
              },
              shape: {
                type: 'poly',
                coords: [10, 0, 17, 3, 20, 9, 10, 27, 0, 9, 3, 3],
              },
            }"
          />
        </GoogleMap>
      </div>
  </transition>
</template>

<style lang="scss">
@import '../assets/styles/components/map.scss';
</style>
