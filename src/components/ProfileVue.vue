<script setup>
import { apiImage } from '@/utilities/apiImage';
import { onMounted, computed, ref } from 'vue';
import Title from '@/components/Title.vue';
import { isDemo } from '@/demo/session';
import { useProfileStore } from '@/stores/profile';
import { useRoute } from 'vue-router';
import PreLoader from '../components/PreLoader.vue';
import UserRoleBadge from './UserRoleBadge.vue';
import { toast } from 'vue3-toastify';
import { useAuthStore } from '@/stores/auth';

const profileStore = useProfileStore();
const user = computed(() => profileStore.viewProfile);
const route = useRoute();
const isLoading = computed(() => profileStore.loading);
const id = route.params.id;
const authStore = useAuthStore();
const demo = isDemo();
const avatarBroken = ref(false);
const avatarUrl = computed(() => apiImage(user.value?.image));
const initials = computed(() => (user.value?.username || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase());

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
  return apiImage(location);
};

const visibleImages = computed(() => {
  const images = user.value?.images || [];
  return images.map(img => {
    const isA2urbex = typeof img === 'string' && img && (!img.startsWith('http') || img.includes('a2urbex.com'));
    return {
      src: isA2urbex ? getImageUrl(img) : '/default.png',
      blurred: !isA2urbex,
    };
  });
});

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
  <Title title="Profile" />
  <transition name="fade" mode="out-in">
    <PreLoader msg="Profile" v-if="isLoading" key="preloader" />
  </transition>

  <div class="ios-page pf">
    <!-- En-tête : avatar (initiales en secours), nom, rôle, chiffres -->
    <header class="pf-head">
      <img v-if="avatarUrl && !avatarBroken" class="pf-head__avatar" :src="avatarUrl" alt="" @error="avatarBroken = true" />
      <span v-else class="pf-head__avatar pf-head__avatar--initials">{{ initials }}</span>
      <h2 class="pf-head__name">{{ user.username }} <UserRoleBadge :roles="user.roles" /></h2>
      <p v-if="user.about" class="pf-head__about">{{ user.about }}</p>
      <div class="pf-head__stats">
        <div><b>{{ user.urbexCount ?? '–' }}</b><small>Spots</small></div>
        <div><b>{{ user.friendCount ?? '–' }}</b><small>Friends</small></div>
      </div>
    </header>

    <!-- Actions : ami / demande / modifier (jamais en démo), partage -->
    <div class="pf-actions">
      <template v-if="!isSelf">
        <template v-if="friendshipState === 'waiting'">
          <button class="pf-btn pf-btn--tint" @click="handleAction('accept')"><font-awesome-icon :icon="['fas', 'check']" />Accept</button>
          <button class="pf-btn pf-btn--danger" @click="handleAction('decline')"><font-awesome-icon :icon="['fas', 'xmark']" />Decline</button>
        </template>
        <button v-else class="pf-btn" :class="{ 'pf-btn--tint': friendshipState === 'none', 'pf-btn--danger': friendshipState === 'friends' }" @click="handleAction()">
          <font-awesome-icon :icon="buttonIcon" />{{ buttonText }}
        </button>
      </template>
      <button v-else-if="!demo" class="pf-btn" @click="$router.push('/edit-profile')"><font-awesome-icon :icon="['fas', 'pencil']" />Edit profile</button>
      <button class="pf-btn pf-btn--icon" @click="copyLink" aria-label="Copy profile link"><font-awesome-icon :icon="['fas', 'arrow-up-from-bracket']" /></button>
    </div>

    <div v-if="user.youtube || user.instagram || user.tiktok" class="pf-social">
      <a v-if="user.youtube" :href="user.youtube" target="_blank" rel="noopener" aria-label="YouTube"><font-awesome-icon :icon="['fab', 'Youtube']" /></a>
      <a v-if="user.instagram" :href="'https://instagram.com/' + user.instagram" target="_blank" rel="noopener" aria-label="Instagram"><font-awesome-icon :icon="['fab', 'instagram']" /></a>
      <a v-if="user.tiktok" :href="'https://tiktok.com/@' + user.tiktok" target="_blank" rel="noopener" aria-label="TikTok"><font-awesome-icon :icon="['fab', 'tiktok']" /></a>
    </div>

    <section v-if="(!user.isPrivate || isSelf) && visibleImages.length" class="ios-section">
      <h3 class="ios-header">Spots</h3>
      <div class="pf-grid">
        <div v-for="(item, index) in visibleImages" :key="index" class="pf-grid__item" :class="{ 'is-blurred': item.blurred }">
          <img :src="item.src" alt="" loading="lazy" @error="(e) => (e.target.style.visibility = 'hidden')" />
        </div>
      </div>
    </section>
  </div>
</template>
