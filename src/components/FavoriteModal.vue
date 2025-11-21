<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useLocationStore } from '@/stores/location';
import { useFavoritesStore } from '@/stores/favorites';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  id: {
    type: String,
  },
  code: {
    type: String,
  },
  fids: {
    type: Array,
    default: () => [],
  },
});

const locationStore = useLocationStore();
const favoritesStore = useFavoritesStore();
const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.token !== null);
const fidsRef = computed(() => locationStore.location?.fids || []);
const favoriteList = computed(() => favoritesStore.favoriteList);
const isActive = ref(false);

const isCreatingList = ref(false);
const newListName = ref('');
const inputRef = ref(null);

const toggleActive = async () => {
  isActive.value = !isActive.value;
  if (isActive.value) {
    await favoritesStore.getSummary();
    await locationStore.getLocation(props.id);
  }
};

const isItemInFids = (itemId) => fidsRef.value.includes(itemId);

const addToSelectedList = async (id) => {
  await favoritesStore.addLocation(props.id, id);
  await locationStore.getLocation(props.id);
  await favoritesStore.getSummary();
  locationStore.fetchLocations(locationStore.currentPage, locationStore.selectedFilters, false);
};

const handleCreateList = async () => {
  isCreatingList.value = true;

  await nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    } else {
      console.error('inputRef is null, cannot focus the input');
    }
  });
};

const submitNewList = async () => {
  if (newListName.value.trim()) {
    await favoritesStore.createNewList(newListName.value, props.id);
    newListName.value = '';
  }
  isCreatingList.value = false;
  await locationStore.getLocation(props.id);
  await favoritesStore.getSummary();
  locationStore.fetchLocations(locationStore.currentPage, locationStore.selectedFilters, false);
};

const handleInputBlur = () => {
  submitNewList();
};
</script>

<template>
  <div v-if="isLoggedIn">
    <div class="favorite-modal">
      <div class="favorite-modal__trigger" @click="toggleActive">
        <font-awesome-icon :icon="['fas', 'heart']" />
      </div>
    </div>
    <div :class="['favorite-modal__content', { active: isActive }]">
      <div class="favorite-modal__content-header" @click="toggleActive">
        <button class="close-button" @click="$emit('close')">
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
        <h3>Add to list</h3>
      </div>
      <fieldset>
        <div v-for="item in favoriteList" :key="item.id">
          <input type="radio" :id="`radio-${item.id}-${props.id}`" name="contactMethod" @click="addToSelectedList(item.id)" />
          <label :for="`radio-${item.id}-${props.id}`">
            {{ item.name }}
            <span>
              <font-awesome-icon v-if="isItemInFids(item.id)" :icon="['fa', 'circle-check']" />
              <font-awesome-icon v-else :icon="['fa', 'plus']" />
            </span>
          </label>
        </div>
      </fieldset>
      <div class="favorite-modal__content-footer">
        <div v-if="isCreatingList">
          <input type="text" v-model="newListName" placeholder="Enter list name" ref="inputRef" @blur="handleInputBlur" @keyup.enter="submitNewList" />
        </div>
        <button v-else class="favorite-modal__content-footer-button-create" @click="handleCreateList">Create List</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '@/assets/styles/components/favoriteModal.scss';
</style>
