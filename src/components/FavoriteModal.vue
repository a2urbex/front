<script setup>
import { ref, computed, watch } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useFavoritesStore } from '@/stores/favorites';
import { useAuthStore } from '@/stores/auth';
import { useMapStore } from '@/stores/map';

const props = defineProps({
  id: { type: String },
  code: { type: String },
  fids: { type: Array, default: () => [] },
});

const locationStore = useLocationStore();
const favoritesStore = useFavoritesStore();
const mapStore = useMapStore();
const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.token !== null);
const favoriteList = computed(() => favoritesStore.favoriteList || []);
const isActive = ref(false);
const loadingLists = ref(false);
const busy = ref(null);
const creating = ref(false);
const newListName = ref('');
// listes contenant ce point (mise à jour immédiate à l'écran, puis confirmée par le serveur)
const inLists = ref(new Set(props.fids || []));
watch(() => props.fids, (f) => { inLists.value = new Set(f || []); });

// Le point est aussi présent dans les listes affichées (cartes, carte) : on garde ses fids à jour sans tout recharger
const syncFids = () => {
  const fids = [...inLists.value];
  for (const list of [locationStore.locationsList, mapStore.locations]) {
    const item = (list || []).find((l) => l.id === props.id);
    if (item) item.fids = fids;
  }
};

const open = () => {
  isActive.value = true;
  loadingLists.value = true;
  Promise.all([
    favoritesStore.getSummary().catch(() => {}),
    locationStore.getLocation(props.id).then(() => {
      if (locationStore.location?.id === props.id) inLists.value = new Set(locationStore.location?.fids || []);
    }).catch(() => {}),
  ]).finally(() => { loadingLists.value = false; });
};
const close = () => { isActive.value = false; };

const toggleList = async (listId) => {
  busy.value = listId;
  const next = new Set(inLists.value);
  next.has(listId) ? next.delete(listId) : next.add(listId);
  inLists.value = next;
  try {
    await favoritesStore.addLocation(props.id, listId);
    syncFids();
  } catch {
    open();
  } finally {
    busy.value = null;
  }
};

const submitNewList = async () => {
  const name = newListName.value.trim();
  if (!name) return;
  creating.value = true;
  try {
    await favoritesStore.createNewList(name, props.id);
    newListName.value = '';
    await favoritesStore.getSummary();
    const created = favoriteList.value.find((l) => l.name === name);
    if (created) inLists.value = new Set([...inLists.value, created.id]);
    syncFids();
    favoritesStore.getList().catch(() => {}); // l'onglet Lists affiche aussitôt la nouvelle liste
  } finally {
    creating.value = false;
  }
};
</script>

<template>
  <div v-if="isLoggedIn">
    <div class="favorite-modal">
      <div class="favorite-modal__trigger" :class="{ 'is-favorite': inLists.size > 0 }" @click="open">
        <font-awesome-icon :icon="['fas', 'heart']" />
      </div>
    </div>
    <!-- Feuille « Save to a list » : s'ouvre tout de suite, les listes arrivent ensuite -->
    <Teleport to="body">
      <div v-if="isActive" class="ios-sheet-backdrop" @click.self="close">
        <div class="ios-action-sheet fav-sheet" role="dialog" aria-label="Save to a list" v-swipe-close="close">
          <div class="ios-action-sheet__group">
            <p class="ios-action-sheet__title">Save to a list</p>
            <div class="fav-sheet__lists">
              <p v-if="loadingLists && !favoriteList.length" class="fav-sheet__empty"><span class="ios-spinner"></span>Loading your lists…</p>
              <button v-for="item in favoriteList" :key="item.id" class="ios-action-sheet__btn fav-sheet__row" :disabled="busy === item.id" @click="toggleList(item.id)">
                <font-awesome-icon :icon="['fas', 'list-ul']" />
                <span class="fav-sheet__name">{{ item.name }}</span>
                <font-awesome-icon v-if="inLists.has(item.id)" class="fav-sheet__check" :icon="['fas', 'check']" />
              </button>
              <p v-if="!loadingLists && !favoriteList.length" class="fav-sheet__empty">No list yet. Create your first one below.</p>
            </div>
            <form class="fav-sheet__new" @submit.prevent="submitNewList">
              <input :id="`new-list-${props.id}`" v-model="newListName" type="text" placeholder="New list name" autocomplete="off" />
              <button type="submit" class="ios-pill ios-pill--tint" :disabled="!newListName.trim() || creating">{{ creating ? 'Creating…' : 'Create' }}</button>
            </form>
          </div>
          <button class="ios-action-sheet__btn ios-action-sheet__cancel" @click="close">Done</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/components/favoriteModal.scss' as *;
</style>
