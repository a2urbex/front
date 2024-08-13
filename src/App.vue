<script setup>
import HomePage from './components/HomePage.vue'
</script>

<template>
  <div>
    <a href="https://a2urbex.eu" target="_blank">
      <img src="/logox192.png" class="logo" alt="a2urbex logo" />
    </a>
  </div>
  <HomePage msg="a2urbex - Your exploration co-pilot" />
  <p class="test">Check out our repository on <a href="https://github.com/a2urbex" target="_blank">Github</a></p>
</template>

<style lang="scss" scoped>
  @import './assets/homepage.scss';
</style>
