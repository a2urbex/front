<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <!-- <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
  </div> -->

  <p>Check out our repository on <a href="hhttps://github.com/a2urbex" target="_blank">Github</a></p>
  <p class="read-the-docs">Work in progress</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
