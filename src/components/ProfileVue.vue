<script setup>
import { onMounted, computed, ref } from 'vue';
import { useProfileStore } from '@/stores/profile';
import { useRoute } from 'vue-router';
import PreLoader from '../components/PreLoader.vue';

const profileStore = useProfileStore();
const user = computed(() => profileStore.viewProfile);
const route = useRoute();
const isLoading = computed(() => profileStore.loading);


onMounted(async () => {
  const id = route.params.id;
  try {
    await profileStore.getProfile(id);
  } catch (error) {
  }
});
</script>

<template>
  <transition name="fade" mode="out-in">
    <PreLoader msg="Profile" v-if="isLoading" key="preloader" /> 
  </transition>

  <div class="profile page-width">
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
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/profile.scss';
</style>
