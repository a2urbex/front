<script setup>
import { onMounted, computed } from 'vue';
import { useProfileStore } from '@/stores/profile';
import { useRoute } from 'vue-router';
import PreLoader from '../components/PreLoader.vue';
import { toast } from 'vue3-toastify';
import { useAuthStore } from '@/stores/auth';

const profileStore = useProfileStore();
const user = computed(() => profileStore.viewProfile);
const route = useRoute();
const isLoading = computed(() => profileStore.loading);
const id = route.params.id;
const authStore = useAuthStore();

const isSelf = computed(() => {
  return authStore.userProfile?.id === id;
});

const friendshipState = computed(() => {
  if (isSelf.value) return 'self';
  
  const friends = profileStore.friendsList.friends || [];
  const pending = profileStore.friendsList.pending || [];
  const waiting = profileStore.friendsList.waiting || [];

  if (friends.some(friend => friend.id === id)) return 'friends';
  if (pending.some(friend => friend.id === id)) return 'pending';
  if (waiting.some(friend => friend.id === id)) return 'waiting';
  return 'none';
});

const handleAction = async (action) => {
  try {
    switch (friendshipState.value) {
      case 'none':
        await profileStore.addFriend(id);
        toast.success('Friend request sent!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        break;
      case 'pending':
        await profileStore.cancelFriendRequest(id);
        toast.success('Friend request cancelled!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        break;
      case 'waiting':
        if (action === 'accept') {
          await profileStore.acceptFriendRequest(id);
          toast.success('Friend request accepted!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        } else if (action === 'decline') {
          await profileStore.rejectFriendRequest(id);
          toast.success('Friend request declined!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        }
        break;
      case 'friends':
        await profileStore.removeFriend(id);
        toast.success('Friend removed!', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
        break;
    }
    await profileStore.getFriends();
  } catch (error) {
    toast.error('Action failed', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
  }
};

const buttonText = computed(() => {
  switch (friendshipState.value) {
    case 'self': return 'Edit Profile';
    case 'friends': return 'Remove Friend';
    case 'pending': return 'Cancel Request';
    case 'waiting': return 'Respond to Request';
    default: return 'Add Friend';
  }
});

const buttonIcon = computed(() => {
  switch (friendshipState.value) {
    case 'self': return ['fas', 'user-edit'];
    case 'friends': return ['fas', 'user-minus'];
    case 'pending': return ['fas', 'times'];
    case 'waiting': return ['fas', 'user-clock'];
    default: return ['fas', 'user-plus'];
  }
});

const getImageUrl = (location) => {
  return location && location.includes('http')
    ? location
    : `${import.meta.env.VITE_API_BASE_URL}${location || ''}`;
};

onMounted(async () => {
  try {
    await Promise.all([
      profileStore.getProfile(id),
      profileStore.getFriends()
    ]);
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
      <div class="profile__actions">
        <template v-if="!isSelf">
          <template v-if="friendshipState === 'waiting'">
            <button class="profile__actions-button profile__actions-button--accept" @click="handleAction('accept')">
              <font-awesome-icon :icon="['fas', 'check']" />
              Accept
            </button>
            <button class="profile__actions-button profile__actions-button--decline" @click="handleAction('decline')">
              <font-awesome-icon :icon="['fas', 'times']" />
              Decline
            </button>
          </template>
          <button v-else class="profile__actions-button" @click="handleAction()">
            <font-awesome-icon :icon="buttonIcon" />
            {{ buttonText }}
          </button>
        </template>
        <button v-else class="profile__actions-button" @click="$router.push('/edit-profile')">
          <font-awesome-icon :icon="buttonIcon" />
          {{ buttonText }}
        </button>
      </div>
    </div>
    <div class="profile__social">
      <a v-if="user.youtube" :href="user.youtube" target="_blank"><font-awesome-icon :icon="['fab', 'Youtube']" /></a>
      <a v-if="user.instagram" :href="'http://instagram.com/' + user.instagram" target="_blank"><font-awesome-icon :icon="['fab', 'instagram']" /></a>
      <a v-if="user.tiktok" :href="'http://tiktok.com/@' + user.tiktok" target="_blank"><font-awesome-icon :icon="['fab', 'tiktok']" /></a>
    </div>  
  </div>
  <div v-if="!user.isPrivate || isSelf" class="profile__locations">
    <div v-for="(location, index) in user.images" :key="index" class="profile__locations-item">
        <img v-if="location"  :src="getImageUrl(location)" :alt="'location-profile-' + user.username">
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/profile.scss';
</style>
