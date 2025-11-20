<script setup>
import HeaderComponent from '@/components/Header.vue';
import MapComponent from '@/components/Map.vue';
import AddLocationComponent from '@/components/LocationAdd.vue';
import { ref, watch } from 'vue';
import { useVersionStore } from '@/stores/version';
import { useUIStore } from '@/stores/ui';

const showAddLocation = ref(false);
const versionStore = useVersionStore();
const uiStore = useUIStore();

const toggleAddLocation = () => {
  showAddLocation.value = !showAddLocation.value;
};

watch(() => uiStore.isTransitioning, (newValue) => {
  const appElement = document.getElementById('app');
  if (appElement) {
    if (newValue) {
      appElement.classList.add('is-transitioning');
    } else {
      appElement.classList.remove('is-transitioning');
    }
  }
});


</script>

<template>
  <!-- Header -->
  <HeaderComponent v-if="!uiStore.isTransitioning" @toggle-add-location="toggleAddLocation" />

  <!-- Map -->
  <MapComponent />

  <!-- Add Location -->
  <AddLocationComponent v-if="showAddLocation" @close="showAddLocation = false" />

  <!-- Content -->
  <router-view />

  <!-- <div class="version-info m-none">
    <span>You are using version: {{ versionStore.code_version }}. </span>
    <span> <b>This version is still in development</b></span>
  </div> -->
</template>
