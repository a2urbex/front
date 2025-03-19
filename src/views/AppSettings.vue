<script setup>
import { computed } from 'vue';
import { useVersionStore } from '@/stores/version';

const versionStore = useVersionStore();

const emit = defineEmits(['toggle-add-location']);
const latest_version = computed(() => versionStore.latest_version);
const code_version = computed(() => versionStore.code_version);
const status = computed(() => versionStore.status);


const clearCache = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      registration.unregister();
    }
  }
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('Caches cleared:' + cacheNames);
    for (let cacheName of cacheNames) {
      console.log('Caches cleared:' + cacheName);
      caches.delete(cacheName); 
    }
  }
  window.location.reload();
};

</script>
<template>
    <div class="app-settings">
        <img src="/logox192.png" class="app-settings__logo" alt="a2urbex logo" />
        <p class="app-settings__title">a2urbex @2025</p>

        <p class="app-settings__version"> Current version: v{{ code_version }}</p>
        <p class="app-settings__version"> Latest version: v{{ latest_version }}</p>

            <div v-if="status === 'up-to-date'" class="app-settings__button refresh" @click="toggleOpen">
                <p class="uptodate">Up to date</p>
            </div>
            <div v-if="status === 'outdated'" @click="() => { clearCache(); toggleOpen(); }" class="app-settings__button refresh">
                <button class="outaded">Refresh App<font-awesome-icon :icon="['fa', 'rotate-right']" /> </button>
            </div>
        </div>
</template>

<style lang="scss" scoped>
    @import '@/assets/styles/components/appSettings.scss';
</style> 