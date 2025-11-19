<script setup>
import HeaderComponent from '@/components/Header.vue';
import MapComponent from '@/components/Map.vue';
import AddLocationComponent from '@/components/LocationAdd.vue';
import { ref } from 'vue';
import { useVersionStore } from '@/stores/version';

const showAddLocation = ref(false);
const versionStore = useVersionStore();

const toggleAddLocation = () => {
  showAddLocation.value = !showAddLocation.value;
};

</script>

<template>
  <!-- Header -->
  <HeaderComponent @toggle-add-location="toggleAddLocation" />

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
