<script setup>
import { toRaw, watch, ref, computed, nextTick, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import { icon as faIcon } from '@fortawesome/fontawesome-svg-core';
import 'leaflet.markercluster';
import { useLocationStore } from '@/stores/location';
import { useRoute } from 'vue-router';
import FavoritesModal from './FavoriteModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useMapStore } from '@/stores/map';
import ImageSlider from './ImageSlider.vue';
import FieldStatus from './FieldStatus.vue';
import DateSlider from './DateSlider.vue';
import Filters from './Filters.vue';
import { createZoneDraw } from '@/utilities/zoneDraw';
import { useFavoritesStore } from '@/stores/favorites';
import { request } from '@/services/api';
import { toast } from 'vue3-toastify';
import { statusEmoji, formatDistance } from '@/utilities/field';
import { usePositionStore } from '@/stores/position';
import { useExplorationStore } from '@/stores/exploration';

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

const isNew = (item) => mapStore.highlightFrom && item.dateAdd && Date.parse(item.dateAdd) >= mapStore.highlightFrom

// Pin rond coloré par type + icône du type (SVG mis en cache par catégorie)
const glyphCache = new Map()
const glyph = (name) => {
  const key = (name || 'map-pin').replace(/^fa-/, '')
  if (!glyphCache.has(key)) glyphCache.set(key, faIcon({ prefix: 'fas', iconName: key })?.html?.[0] || faIcon({ prefix: 'fas', iconName: 'map-pin' })?.html?.[0] || '')
  return glyphCache.get(key)
}
// Palette maison : même saturation / luminosité pour tous les types (les couleurs DB sont trop hétérogènes)
const TYPE_COLORS = {
  'fa-chess-rook': '#9cc271',
  'fa-hotel': '#c49a78',
  'fa-film': '#e0766b',
  'fa-train': '#7fa2d6',
  'fa-hospital': '#6cc4bd',
  'fa-house': '#9fb3d4',
  'fa-industry': '#d4c26a',
  'fa-building': '#c983a8',
  'fa-utensils': '#b3aba0',
  'fa-jet-fighter-up': '#a3b487',
}
const FALLBACK = ['#9cc271', '#7fa2d6', '#e0766b', '#d4c26a', '#c983a8', '#6cc4bd']
const typeColor = (item) => {
  const k = item.categoryIcon || ''
  if (TYPE_COLORS[k]) return TYPE_COLORS[k]
  let h = 0
  for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) | 0
  return k ? FALLBACK[Math.abs(h) % FALLBACK.length] : '#a8a39a'
}

const buildIcon = (item) => L.divIcon({
  html: `<span class="map-dot" style="--c:${typeColor(item)}">${glyph(item.categoryIcon)}</span>`
    + (statusEmoji(item) ? `<span class="map-pin-status">${statusEmoji(item)}</span>` : '')
    + (isActiveList.value ? `<span class="map-pin-dist">${position.labelTo(item)}</span>` : ''),
  className: ['map-pin', isNew(item) && 'map-pin--new', item.status === 'invalid' && 'map-pin--invalid'].filter(Boolean).join(' '),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Clusters : carré à bords francs avec le compte en mono
const clusterIcon = (c) => {
  const n = c.getChildCount()
  const size = n < 10 ? 30 : n < 100 ? 36 : n < 1000 ? 42 : 48
  return L.divIcon({ html: `<span>${n >= 1000 ? `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k` : n}</span>`, className: 'map-cluster', iconSize: [size, size] })
}

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
  const clip = mapStore.clipTo
  const layers = []
  for (const item of locations) {
    if (clip && item.dateAdd && Date.parse(item.dateAdd) > clip) continue
    const lat = Number(item.lat)
    const lon = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue // ignore les coordonnées invalides
    const marker = L.marker([lat, lon], { icon: buildIcon(item), title: item.name || '' })
    marker.on('click', () => displayOverlay(item))
    markersById.set(item.id, marker)
    layers.push(marker)
  }
  cluster.addLayers(layers)
  if (position.pos && !userDot) userDot = L.circleMarker(position.pos, { pane: 'userPane', radius: 8, color: '#fff', weight: 3, fillColor: '#2a7fff', fillOpacity: 1 }).addTo(map)

  // ré-applique le highlight si une fiche est ouverte après un re-render (changement de filtres)
  if (overlayOpen.value && itemSelected.value) selectMarker(itemSelected.value)
}

// --- Position live : au tap, ou automatiquement pendant une exploration ---
const position = usePositionStore()
const exploration = useExplorationStore()
const userPos = computed(() => position.pos)
let userDot = null
let centerOnFix = false

const locate = () => {
  if (position.pos && map) map.setView(position.pos, Math.max(map.getZoom(), 15))
  else centerOnFix = true
  position.start()
}

const isActiveList = computed(() => mapStore.type === 'favorite' && exploration.active?.favoriteId === mapStore.typeId)

const updateDistances = () => {
  if (!isActiveList.value) return
  for (const [id, marker] of markersById) {
    const el = marker.getElement()?.querySelector('.map-pin-dist')
    if (!el) continue
    const item = (mapStore.locations || []).find((l) => l.id === id)
    el.textContent = item ? position.labelTo(item) : ''
  }
}

watch(() => position.pos, (p) => {
  if (!map || !p) {
    if (!p && userDot && map) { map.removeLayer(userDot); userDot = null }
    return
  }
  if (!userDot) userDot = L.circleMarker(p, { pane: 'userPane', radius: 8, color: '#fff', weight: 3, fillColor: '#2a7fff', fillOpacity: 1 }).addTo(map)
  else userDot.setLatLng(p)
  if (centerOnFix) { map.setView(p, Math.max(map.getZoom(), 14)); centerOnFix = false }
  updateDistances()
})

// Prochain point non visité de la liste active
const nextPoint = computed(() => {
  if (!position.pos || mapStore.type !== 'favorite') return null
  let best = null
  for (const item of mapStore.locations || []) {
    if (item.status && item.status !== 'unvisited') continue
    const d = position.distanceTo(item)
    if (d !== null && (!best || d < best.d)) best = { item, d }
  }
  return best
})

const goToNext = () => {
  if (!nextPoint.value || !map) return
  const { item } = nextPoint.value
  map.setView([Number(item.lat), Number(item.lon)], Math.max(map.getZoom(), 16))
  displayOverlay(item)
}

const toggleInvalid = () => {
  mapStore.showInvalid = !mapStore.showInvalid
  mapStore.getMapLocations(true)
}

const onStatusUpdated = (updated) => {
  const hide = updated.status === 'invalid' && !mapStore.showInvalid
  mapStore.locations = hide
    ? mapStore.locations.filter((l) => l.id !== updated.id)
    : mapStore.locations.map((l) => (l.id === updated.id ? updated : l))
  if (hide) overlayOpen.value = false
  else itemSelected.value = updated
}

// --- Zone dessinée + frise des imports (carte globale uniquement) ---
const favoritesStore = useFavoritesStore()
const isGlobal = computed(() => mapStore.type === 'location')
const drawMode = ref(null)
const polyPoints = ref(0)
const showSlider = ref(false)
const showFilters = ref(false)
const showListPicker = ref(false)
const adding = ref(false)
let zoneDraw = null

const startDraw = (m) => {
  if (!zoneDraw) return
  if (drawMode.value === m) { zoneDraw.clear(); drawMode.value = null; return }
  drawMode.value = m
  polyPoints.value = 0
  zoneDraw.start(m)
}

const closePolygon = () => {
  if (zoneDraw?.close()) drawMode.value = null
}

const clearZone = () => {
  zoneDraw?.clear()
  drawMode.value = null
}

const openListPicker = async () => {
  showListPicker.value = true
  if (!favoritesStore.locationsList?.length) await favoritesStore.getList()
}

const addZoneToList = async (fav) => {
  if (adding.value) return
  adding.value = true
  try {
    const ids = (mapStore.locations || []).map((l) => l.id)
    const res = await request('POST', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/${fav.id}/locations`, { ids })
    toast.success(`${res.added} point(s) added to "${fav.name}"`, { position: toast.POSITION.TOP_CENTER, autoClose: 1500, theme: 'dark' })
    showListPicker.value = false
  } finally {
    adding.value = false
  }
}

const initMap = () => {
  if (map || !mapEl.value) return
  map = L.map(mapEl.value, { center, zoom })
  map.createPane('userPane').style.zIndex = 650
  zoneDraw = createZoneDraw(map, (zone) => {
    drawMode.value = null
    mapStore.setZone(zone)
  }, (n) => { polyPoints.value = n })
  // Tuiles OSM sans clé, assombries en CSS (.map-tiles-dark)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    className: 'map-tiles-dark',
  }).addTo(map)
  cluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 40,
    animate: false,            // pas d'animation de regroupement -> nettement moins de lag au zoom/pan
    removeOutsideVisibleBounds: true,
    iconCreateFunction: clusterIcon,
    showCoverageOnHover: false,
  })
  map.addLayer(cluster)
  // recalcule la taille après l'animation d'ouverture du conteneur
  setTimeout(() => { if (map) map.invalidateSize() }, 250)
  renderMarkers()
}

const destroyMap = () => {
  clearSelection()
  if (!exploration.active) position.stop()
  userDot = null
  zoneDraw = null
  drawMode.value = null
  showSlider.value = false
  showListPicker.value = false
  mapStore.zone = null
  mapStore.dateFrom = mapStore.dateTo = mapStore.clipTo = mapStore.highlightFrom = null
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
  mapStore.loaded = { type: null, typeId: null, filters: null }
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

watch(() => [mapStore.locations, mapStore.clipTo], () => renderMarkers());

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
      <div :class="['map-container', { 'full-height': !isAuthenticated, 'has-sheet': overlayOpen }]" id="map" v-if="mapStore.open">
        <div class="map-leaflet" ref="mapEl"></div>

        <div class="map-field-ctrl">
          <button class="map-ctrl-btn" :class="{ active: userPos }" @click="locate" title="My position">
            <font-awesome-icon :icon="['fas', 'location-crosshairs']" />
          </button>
          <button class="map-ctrl-btn" :class="{ active: mapStore.showInvalid }" @click="toggleInvalid" title="Show invalid points">
            <font-awesome-icon :icon="['fas', 'ban']" />
          </button>
        </div>

        <div class="map-zone-ctrl" v-if="isGlobal">
          <button class="map-ctrl-btn" :class="{ active: drawMode === 'circle' }" @click="startDraw('circle')" title="Circle zone">
            <font-awesome-icon :icon="['fas', 'circle-dot']" />
          </button>
          <button class="map-ctrl-btn" :class="{ active: drawMode === 'polygon' }" @click="startDraw('polygon')" title="Polygon zone">
            <font-awesome-icon :icon="['fas', 'draw-polygon']" />
          </button>
          <button class="map-ctrl-btn" :class="{ active: showSlider || mapStore.dateFrom || mapStore.dateTo }" @click="showSlider = !showSlider" title="Import date">
            <font-awesome-icon :icon="['fas', 'calendar-days']" />
          </button>
          <button class="map-ctrl-btn" :class="{ active: showFilters }" @click="showFilters = !showFilters" title="Filters">
            <font-awesome-icon :icon="['fas', 'sliders']" />
          </button>
        </div>

        <div class="map-filters" v-if="isGlobal && showFilters">
          <div class="map-filters__head">
            <span>Filters</span>
            <button @click="showFilters = false" aria-label="Close"><font-awesome-icon :icon="['fa', 'xmark']" /></button>
          </div>
          <Filters idPrefix="map-" :hideSearch="true" />
        </div>

        <div class="map-zone-bar" v-if="isGlobal && (drawMode || mapStore.zone)">
          <template v-if="drawMode === 'circle'"><span>Tap the centre, then the edge</span></template>
          <template v-else-if="drawMode === 'polygon'">
            <span>Tap the corners</span>
            <button class="zb-btn" :disabled="polyPoints < 3" @click="closePolygon">Done</button>
          </template>
          <template v-else>
            <span class="zb-count">{{ mapStore.locations?.length || 0 }} pts</span>
            <button class="zb-btn zb-btn--main" @click="openListPicker" :disabled="!mapStore.locations?.length">
              <font-awesome-icon :icon="['fas', 'folder-plus']" /> Add to a list
            </button>
          </template>
          <button class="zb-btn" @click="clearZone">Clear</button>
        </div>

        <div class="map-list-picker" v-if="showListPicker">
          <div class="map-list-picker__head">
            <span>Add {{ mapStore.locations?.length }} points to…</span>
            <button @click="showListPicker = false"><font-awesome-icon :icon="['fa', 'xmark']" /></button>
          </div>
          <button v-for="fav in favoritesStore.locationsList" :key="fav.id" class="map-list-picker__item" :disabled="adding" @click="addZoneToList(fav)">
            {{ fav.name }} <small v-if="fav.count !== undefined">{{ fav.count }}</small>
          </button>
          <p v-if="!favoritesStore.locationsList?.length" class="map-list-picker__empty">No list</p>
        </div>

        <DateSlider v-if="isGlobal && showSlider" class="map-date-slider" />

        <button class="map-next" v-if="nextPoint" @click="goToNext" title="Closest unvisited spot">
          <font-awesome-icon class="map-next__icon" :icon="['fas', 'location-arrow']" />
          <span class="map-next__name">{{ nextPoint.item.name || 'Unnamed' }}</span>
          <span class="map-next__dist">{{ formatDistance(nextPoint.d) }}</span>
        </button>

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
             Loading locations<span class="dots"><i>.</i><i>.</i><i>.</i></span>
            </p>
          </div>
        </transition>

        <transition name="sheet">
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
                <p class="map-overlay-fake" v-if="itemSelected?.fake">Fake data · this place does not exist</p>
                <p class="map-overlay-title">{{ itemSelected?.name }}</p>
                <p class="map-overlay-dist" v-if="position.pos && itemSelected">{{ position.labelTo(itemSelected) }} from you</p>
                <FieldStatus v-if="itemSelected?.id" :key="itemSelected.id" :item="itemSelected" @updated="onStatusUpdated" />

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
