<script setup>
import HeaderComponent from '@/components/Header.vue'
import MapComponent from '@/components/Map.vue'
</script>

<template>
  <!-- Header -->
  <HeaderComponent/>
  <!-- Map -->
  <MapComponent />
  <!-- Content -->
  <router-view />
</template>