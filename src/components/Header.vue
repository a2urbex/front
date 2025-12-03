<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useVersionStore } from '@/stores/version';
import HeaderDesktop from './HeaderDesktop.vue';
import HeaderMobile from './HeaderMobile.vue';

const versionStore = useVersionStore();
const authStore = useAuthStore();
const emit = defineEmits(['toggle-add-location']);
const isLoggedIn = computed(() => authStore.token !== null);
const isOpen = ref(false);

const handleAddLocation = () => {
  isOpen.value = false;
  emit('toggle-add-location');
};

onMounted(async () => {
  await versionStore.getVersion();
  if (isLoggedIn.value) {
    try {
      await authStore.fetchUserProfile();
    } catch (error) {
      authStore.logout();
    }
  }
});
</script>

<template>
  <HeaderDesktop @toggle-add-location="handleAddLocation" />
  <HeaderMobile @toggle-add-location="handleAddLocation" />
</template>

<style lang="scss" scoped>
@use '@/assets/styles/components/header.scss' as *;
</style>
