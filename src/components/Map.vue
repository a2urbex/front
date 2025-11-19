<script setup>
import { toRaw, watch, ref, computed } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';
import { useLocationStore } from '@/stores/location';
import { useRoute } from 'vue-router';
import FavoritesModal from './FavoriteModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useMapStore } from '@/stores/map';

const locationStore = useLocationStore();

const props = defineProps({
    location: Object
});

const route = useRoute()
const mapStore = useMapStore();
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.userProfile?.isAdmin || false);
const isAuthenticated = computed(() => !authStore.userProfile);
const userId = computed(() => authStore.userProfile?.id);

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

const emit = defineEmits(['close']);
const showDeleteConfirm = ref(false);

const handleDelete = async () => {
    showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
    if (itemSelected.value && itemSelected.value.id) {
        await locationStore.deleteLocation(itemSelected.value.id);
        mapStore.locations = mapStore.locations.filter(loc => loc.id !== itemSelected.value.id);
        showDeleteConfirm.value = false;
        overlayOpen.value = false;
        itemSelected.value = null;
    }
};

const cancelDelete = () => {
    showDeleteConfirm.value = false;
};

const getMarkerOptions = (item) => {
  const isSelected = itemSelected.value && itemSelected.value.id === item.id

  const baseSize = { height: 27, width: 20 }
  const selectedSize = { height: 36, width: 26 }
  const size = isSelected ? selectedSize : baseSize

	  // Use Google Maps native animation when available
	  const gm = typeof window !== 'undefined' ? window.google : null
	  const animation = isSelected && gm && gm.maps && gm.maps.Animation
	    ? gm.maps.Animation.BOUNCE
	    : null

  return {
    position: { lat: item.lat, lng: item.lon },
    title: item.name,
    zIndex: isSelected ? 10 : 2,
    animation,
    icon: {
      url: `/pins/pin-${item.categoryIcon || 'default'}.png`,
      scaledSize: size,
      origin: { x: 0, y: 0 },
      anchor: { x: size.width / 2, y: size.height },
    },
    shape: {
      type: 'poly',
      coords: [10, 0, 17, 3, 20, 9, 10, 27, 0, 9, 3, 3],
    },
  }
}

</script>

<template>
  <transition name="map" mode="out-in">
      <div :class="['map-container', { 'full-height': !isAuthenticated }]" id="map" v-if="mapStore.open">
        <GoogleMap :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="zoom">
          <Marker 
            v-for="item in mapStore.locations"
            :key="item.id"
            @click="displayOverlay(item)"
            :options="getMarkerOptions(item)"
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

                <div class="map-overlay-image" :style="{ 'background-image': `url(${itemSelected?.image || itemSelected?.image_maps})` }"></div>
                <p class="map-overlay-title">{{ itemSelected?.name }}</p>

                <div class="map-overlay-action">
                  <a class="pin-waze" target="_blank" :href="`https://waze.com/ul?q=${itemSelected?.lat},${itemSelected?.lon}&navigate=yes&zoom=17`">
                    <font-awesome-icon :icon="['fab', 'waze']" />
                  </a>
                  <a class="pin-maps" target="_blank" :href="`https://www.google.com/maps?t=k&q=${itemSelected?.lat},${itemSelected?.lon}`">
                    <font-awesome-icon :icon="['fas', 'earth-europe']" />
                  </a>
                  <FavoritesModal :fids="itemSelected?.fids" :id="itemSelected?.id" />

                  <button v-if="isAdmin || itemSelected?.userId === userId" class="location-edit-button icon-delete" @click="handleDelete">
                      <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                  
                  <div v-if="showDeleteConfirm" class="delete-confirm-overlay map-overlay">
                      <div class="delete-confirm-dialog">
                          <h3>Confirm Delete</h3>
                          <p>Are you sure you want to delete this location?</p>
                          <div class="delete-confirm-actions">
                              <button class="btn-cancel" @click="cancelDelete">Cancel</button>
                              <button class="btn-delete" @click="confirmDelete">Delete</button>
                          </div>
                      </div>
                  </div>
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
