<script setup>
import { onMounted, computed } from 'vue';
import { useProfileStore } from '@/stores/profile';
import { useRoute } from 'vue-router';
import PreLoader from '../components/PreLoader.vue';
import { toast } from 'vue3-toastify';

const profileStore = useProfileStore();
const user = computed(() => profileStore.viewProfile);
const route = useRoute();
const isLoading = computed(() => profileStore.loading);
const id = route.params.id;

const getImageUrl = (location) => {
  return location && location.includes('http')
    ? location
    : `${import.meta.env.VITE_API_BASE_URL}${location || ''}`;
};

onMounted(async () => {
  try {
    await profileStore.getProfile(id);
  } catch (error) {
  }
});

// COPY LINK
const copyLink = () => {
  const url = `${window.location.origin}/profile/${id}`;
  navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
  }).catch(err => {
      toast.error('Failed to copy link', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
  });
};

</script>

<template>
  <transition name="fade" mode="out-in">
    <PreLoader msg="Profile" v-if="isLoading" key="preloader" /> 
  </transition>

  <div class="profile page-width">
    <div class="profile__share" @click="copyLink"><font-awesome-icon :icon="['fa', 'share']" /></div>
    <div class="profile__wrapper">
      <div class="profile__image">
        <img v-if="user.image" :src="user.image" alt="Profile image">
      </div>
      <div class="profile__info">
        <h2>{{ user.username }}</h2>
        <div class="profile__stats">
          <p><span>{{ user.urbexCount }}</span> Location(s)</p>
          <p><span>{{ user.friendCount }}</span> Friend(s)</p>

        </div>
        <p class="profile__about">{{ user.about }}</p>
      </div>
    </div>
    <div class="profile__social">
      <a v-if="user.youtube" :href="user.youtube" target="_blank"><font-awesome-icon :icon="['fab', 'Youtube']" /></a>
      <a v-if="user.instagram" :href="'http://instagram.com/' + user.instagram" target="_blank"><font-awesome-icon :icon="['fab', 'instagram']" /></a>
      <a v-if="user.tiktok" :href="'http://tiktok.com/@' + user.tiktok" target="_blank"><font-awesome-icon :icon="['fab', 'tiktok']" /></a>
    </div>  
  </div>
  <div class="profile__locations">
    <div v-for="(location, index) in user.images" :key="index" class="profile__locations-item">
        <img v-if="location"  :src="getImageUrl(location)" :alt="'location-profile-' + user.username">
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/profile.scss';
</style>
