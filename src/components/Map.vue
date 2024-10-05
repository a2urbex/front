<script setup>
import { toRaw, watch, ref } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';
import { useRoute } from 'vue-router';

import { useMapStore } from '@/stores/map';

const route = useRoute()
const mapStore = useMapStore();

const apiKey = import.meta.env.VITE_MAPS_KEY;
const center = { lat: 46.71109, lng: 1.7191036 };
const zoom = 6;

const overlayOpen = ref(false)
const itemSelected = ref(null)

watch(() => route.fullPath, async () => {
  mapStore.open = false
  mapStore.locations = []
}) 

watch(() => mapStore.open, async (open) => {
  if(open) mapStore.getMapLocations();
  if(!open) overlayOpen.value = false
});

const displayOverlay = (item) => {
  overlayOpen.value = true
  itemSelected.value = toRaw(item)
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

        <transition name="map" mode="out-in">
            <div class="map-overlay" v-if="overlayOpen">
              <div class="map-overlay-inner">
                <div class="top">
                  <div class="top-left">
                    <div class="pin-category">
                      <font-awesome-icon :icon="['fa', itemSelected?.categoryIcon || 'fa-map-pin' ]" />
                      <span>{{ itemSelected?.categoryName || 'other' }}</span>
                    </div>
                  </div>
                  <div class="top-right">
                    <div class="top-right-item" @click="() => overlayOpen = false">
                      <font-awesome-icon :icon="['fa', 'xmark']" />
                    </div>
                  </div>
                </div>

                <div class="map-overlay-image" :style="{ 'background-image': `url(${itemSelected?.image})` }"></div>
                <p class="map-overlay-title">{{ itemSelected?.name }}</p>

                <div class="map-overlay-action">
                  <a class="pin-waze" target="_blank" :href="`https://waze.com/ul?q=${itemSelected?.lat},${itemSelected?.lon}&navigate=yes&zoom=17`">
                    <font-awesome-icon :icon="['fab', 'waze']" />
                  </a>
                  <a class="pin-maps" target="_blank" :href="`https://www.google.com/maps?t=k&q=${itemSelected?.lat},${itemSelected?.lon}`">
                    <font-awesome-icon :icon="['fas', 'earth-europe']" />
                  </a>
                </div>
              </div>
            </div>
        </transition>
      </div>
  </transition>
</template>

<style lang="scss">
@import '../assets/styles/components/map.scss';
</style>
