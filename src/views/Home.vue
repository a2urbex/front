<template>
  <div class="home">
    <div>
      <a href="https://a2urbex.eu" target="_blank">
        <img src="/logox192.png" class="logo" alt="a2urbex logo" />
      </a>
    </div>
    <h1>a2urbex - Your exploration co-pilot</h1>
    <p>Check out our repository on <a href="hhttps://github.com/a2urbex" target="_blank">Github</a></p>
    <router-link class="connect" to="/login">Connect</router-link>
  </div>
</template>
<style lang="scss" scoped>
@import '@/assets/styles/components/home.scss';
</style>
<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.token) {
    const isValid = await authStore.validateToken();
    if (isValid) {
      router.push('/locations');
    }
  }
});
</script>