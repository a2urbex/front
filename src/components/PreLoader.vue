<script setup>
  defineProps({
    msg: String,
  })
</script>

<template>
    <div class="preloader">
        <div class="preloader__spinner">
            <img src="/loading.svg" alt="Loading">
        </div>
       <p class="preloader__text">Loading {{ msg }}...</p>
    </div>
</template>

<style lang="scss">
@use '../assets/styles/components/preloader.scss' as *;
</style>