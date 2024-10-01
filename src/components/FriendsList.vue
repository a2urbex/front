<script setup>
import { onMounted, computed, ref } from 'vue';
import { useProfileStore } from '@/stores/profile';
import PreLoader from '../components/PreLoader.vue';

const profileStore = useProfileStore();
const friendsList = computed(() => profileStore.friendsList);
const isLoading = computed(() => profileStore.loading);

const getFriendImageUrl = (friend) => {
  return friend.image
    ? `${import.meta.env.VITE_API_BASE_URL}${friend.image}`
    : '';
};

onMounted(async () => {
  try {
    await profileStore.getFriends();
  } catch (error) {
  }
});
</script>


<template>
  <transition name="fade" mode="out-in">
    <PreLoader msg="Profile" v-if="isLoading" key="preloader" /> 
  </transition>
  <div class="friends page-width">
    <!-- PENDING -->
    <details class="friends__friends">
      <summary>Pending</summary>
      <div v-for="(friend, index) in friendsList.pending" :key="index" class="friends__item">
        <a :href="'/profile/' + friend.id">
          <div class="friends__item-image-wrapper">
            <img v-if="friend.image" class="friends__item-image" :src="getFriendImageUrl(friend)" :alt="friend.firstname">
          </div>
          <div class="friends__item-text">{{ friend.firstname }}</div>
        </a>
      </div>
    </details>
    <!-- WAITING -->
    <details class="friends__friends">
      <summary>Waiting</summary>
      <div v-for="(friend, index) in friendsList.waiting" :key="index" class="friends__item">
        <a :href="'/profile/' + friend.id">
          <div class="friends__item-image-wrapper">
            <img v-if="friend.image" class="friends__item-image" :src="getFriendImageUrl(friend)" :alt="friend.firstname">
          </div>
          <div class="friends__item-text">{{ friend.firstname }}</div>
        </a>
      </div>
    </details>
    <!-- FRIEND -->
    <details class="friends__friends" open>
      <summary>Friends</summary>
      <div v-for="(friend, index) in friendsList.friends" :key="index" class="friends__item">
        <a :href="'/profile/' + friend.id">
          <div class="friends__item-image-wrapper">
            <img v-if="friend.image" class="friends__item-image" :src="getFriendImageUrl(friend)" :alt="friend.firstname">
          </div>
          <div class="friends__item-text">{{ friend.firstname }}</div>
        </a>
      </div>
    </details>
  </div>
</template>


<style lang="scss" scoped>
@import '@/assets/styles/components/friends.scss';
</style>
