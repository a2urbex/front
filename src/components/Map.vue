<script setup>
import { GoogleMap, Marker } from 'vue3-google-map'

const apiKey = import.meta.env.VITE_MAPS_KEY
const center = { lat: 46.71109, lng: 1.7191036 }
const zoom = 6
</script>

<template>
  <GoogleMap api-key="" style="width: 100%; height: 500px" :center="center" :zoom="zoom" />
</template>
