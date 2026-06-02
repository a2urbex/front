<script setup>
import { toRaw, watch, ref, computed, nextTick, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useLocationStore } from '@/stores/location';
import { useRoute } from 'vue-router';
import FavoritesModal from './FavoriteModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useMapStore } from '@/stores/map';
import ImageSlider from './ImageSlider.vue';

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

const center = [46.71109, 1.7191036];
const zoom = 6;

const overlayOpen = ref(false)
const itemSelected = ref(null)
const hasImage = computed(() => !!(itemSelected.value?.image || itemSelected.value?.image_maps))

// --- Carte Leaflet gérée en impératif (pas de composant par marker) ---
const mapEl = ref(null)      // <div> hôte de la carte Leaflet
let map = null               // instance L.Map
let cluster = null           // L.markerClusterGroup
let markersById = new Map()  // id location -> L.marker
let selectedEl = null        // élément DOM du marker actuellement sélectionné

const buildIcon = (item) => L.divIcon({
  html: `<img src="/pins/pin-${item.categoryIcon || 'default'}.png" alt="${item.name ?? ''}" class="map-pin-img" />`,
  className: 'map-pin',
  iconSize: [20, 27],
  iconAnchor: [10, 27],
})

const clearSelection = () => {
  if (selectedEl) {
    selectedEl.classList.remove('map-pin--selected')
    selectedEl = null
  }
}

const selectMarker = (item) => {
  clearSelection()
  const marker = markersById.get(item.id)
  if (!marker) return
  marker.setZIndexOffset(1000)
  const el = marker.getElement() // null si le marker est replié dans un cluster
  if (el) {
    el.classList.add('map-pin--selected')
    selectedEl = el
  }
}

const renderMarkers = () => {
  if (!map || !cluster) return
  cluster.clearLayers()
  markersById = new Map()
  selectedEl = null

  const locations = mapStore.locations || []
  const layers = []
  for (const item of locations) {
    const lat = Number(item.lat)
    const lon = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue // ignore les coordonnées invalides
    const marker = L.marker([lat, lon], { icon: buildIcon(item), title: item.name || '' })
    marker.on('click', () => displayOverlay(item))
    markersById.set(item.id, marker)
    layers.push(marker)
  }
  cluster.addLayers(layers)

  // ré-applique le highlight si une fiche est ouverte après un re-render (changement de filtres)
  if (overlayOpen.value && itemSelected.value) selectMarker(itemSelected.value)
}

const initMap = () => {
  if (map || !mapEl.value) return
  map = L.map(mapEl.value, { center, zoom })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map)
  cluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 40,
    animate: false,            // pas d'animation de regroupement -> nettement moins de lag au zoom/pan
    removeOutsideVisibleBounds: true,
  })
  map.addLayer(cluster)
  // recalcule la taille après l'animation d'ouverture du conteneur
  setTimeout(() => { if (map) map.invalidateSize() }, 250)
  renderMarkers()
}

const destroyMap = () => {
  clearSelection()
  if (map) {
    map.remove()
    map = null
  }
  cluster = null
  markersById = new Map()
}

watch(() => route.fullPath, async () => {
  mapStore.open = false
  mapStore.locations = []
})

watch(() => mapStore.open, async (open) => {
  if (open) {
    await nextTick()
    initMap()
    mapStore.getMapLocations()
  } else {
    overlayOpen.value = false
    destroyMap()
  }
});

watch(() => mapStore.locations, () => renderMarkers());

watch(() => locationStore.selectedFilters, async () => {
  if (mapStore.open) mapStore.getMapLocations();
}, { deep: true });

const displayOverlay = (item) => {
  overlayOpen.value = true
  itemSelected.value = toRaw(item)
  selectMarker(item)
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

onBeforeUnmount(destroyMap)
</script>

<template>
  <transition name="map" mode="out-in">
      <div :class="['map-container', { 'full-height': !isAuthenticated }]" id="map" v-if="mapStore.open">
        <div class="map-leaflet" ref="mapEl"></div>

        <transition name="map-loader">
          <div class="map-loader" v-if="mapStore.loading">
            <div class="map-loader-radar">
              <span class="ring ring-1"></span>
              <span class="ring ring-2"></span>
              <span class="ring ring-3"></span>
              <span class="sweep"></span>
              <span class="blip blip-1"></span>
              <span class="blip blip-2"></span>
              <span class="blip blip-3"></span>
              <span class="blip blip-4"></span>
              <span class="blip blip-5"></span>
              <span class="core">
                <font-awesome-icon :icon="['fas', 'map-pin']" />
              </span>
            </div>
            <p class="map-loader-text">
              Chargement des points<span class="dots"><i>.</i><i>.</i><i>.</i></span>
            </p>
          </div>
        </transition>

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


                <div class="map-overlay-image">
                  <ImageSlider v-if="hasImage" :images="[itemSelected?.image, itemSelected?.image_maps]" />
                  <div v-else class="map-overlay-image__empty">
                    <span class="map-overlay-image__empty-icon">
                      <font-awesome-icon :icon="['fas', 'image']" />
                    </span>
                    <span class="map-overlay-image__empty-label">No image</span>
                  </div>
                </div>
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
@use '../assets/styles/components/map.scss' as *;
</style>
