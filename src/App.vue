<script setup>
import HeaderComponent from '@/components/Header.vue';
import MapComponent from '@/components/Map.vue';
import AddLocationComponent from '@/components/LocationAdd.vue';
import { ref } from 'vue';

const showAddLocation = ref(false);

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
</template>
