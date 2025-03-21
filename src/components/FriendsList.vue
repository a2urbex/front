<script setup>
import { onMounted, computed, ref } from 'vue';
import { useProfileStore } from '@/stores/profile';
import PreLoader from '../components/PreLoader.vue';
import UserSearch from '../components/UserSearch.vue';
import { toast } from 'vue3-toastify';
import Title from '@/components/Title.vue';

const profileStore = useProfileStore();
const friendsList = computed(() => profileStore.friendsList);
const isLoading = computed(() => profileStore.loading);
const activeTab = ref('friends');

const getFriendImageUrl = (friend) => {
  return friend.image
    ? `${import.meta.env.VITE_API_BASE_URL}${friend.image}`
    : '';
};

const removeFriend = async (friendId) => {
  if (confirm('Are you sure you want to remove this friend?')) {
    try {
      await profileStore.removeFriend(friendId);
      await profileStore.getFriends();
      toast.success('Friend removed successfully', { 
        position: toast.POSITION.TOP_CENTER, 
        autoClose: 1000, 
        pauseOnHover: true, 
        theme: 'dark' 
      });
    } catch (error) {
      toast.error('Failed to remove friend', { 
        position: toast.POSITION.TOP_CENTER, 
        autoClose: 1000, 
        pauseOnHover: true, 
        theme: 'dark' 
      });
    }
  }
};

const cancelFriendRequest = async (friendId) => {
  if (confirm('Are you sure you want to cancel this friend request?')) {
    try {
      await profileStore.cancelFriendRequest(friendId);
      await profileStore.getFriends();
      toast.success('Friend request cancelled successfully', { 
        position: toast.POSITION.TOP_CENTER, 
        autoClose: 1000, 
        pauseOnHover: true, 
        theme: 'dark' 
      });
    } catch (error) {
      toast.error('Failed to cancel friend request', { 
        position: toast.POSITION.TOP_CENTER, 
        autoClose: 1000, 
        pauseOnHover: true, 
        theme: 'dark' 
      });
    }
  }
};

const acceptFriendRequest = async (friendId) => {
  try {
    await profileStore.acceptFriendRequest(friendId);
    await profileStore.getFriends();
    toast.success('Friend request accepted successfully', { 
      position: toast.POSITION.TOP_CENTER, 
      autoClose: 1000, 
      pauseOnHover: true, 
      theme: 'dark' 
    });
  } catch (error) {
    toast.error('Failed to accept friend request', { 
      position: toast.POSITION.TOP_CENTER, 
      autoClose: 1000, 
      pauseOnHover: true, 
      theme: 'dark' 
    });
  }
};

const rejectFriendRequest = async (friendId) => {
  if (confirm('Are you sure you want to reject this friend request?')) {
    try {
      await profileStore.rejectFriendRequest(friendId);
      await profileStore.getFriends();
      toast.success('Friend request rejected successfully', { 
        position: toast.POSITION.TOP_CENTER, 
        autoClose: 1000, 
        pauseOnHover: true, 
        theme: 'dark' 
      });
    } catch (error) {
      toast.error('Failed to reject friend request', { 
        position: toast.POSITION.TOP_CENTER, 
        autoClose: 1000, 
        pauseOnHover: true, 
        theme: 'dark' 
      });
    }
  }
};

onMounted(async () => {
  try {
    await profileStore.getFriends();
  } catch (error) {
  }
});
</script>

<template>
  <Title title="Friends" />
  <transition name="fade" mode="out-in">
    <PreLoader msg="Profile" v-if="isLoading" key="preloader" />
  </transition>
  <div class="friends page-width">
  <UserSearch/>
    <!-- Tab Navigation -->
    <div class="friends__tabs">
      <button
        class="friends__tab"
        :class="{ active: activeTab === 'friends' }"
        @click="activeTab = 'friends'"
      >
        Friends
      </button>
      <button
        class="friends__tab"
        :class="{ active: activeTab === 'waiting' }"
        @click="activeTab = 'waiting'"
      >
        Waiting
      </button>
      <button
        class="friends__tab"
        :class="{ active: activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        Pending
      </button>
    </div>

    <!-- Tab Content -->
    <!-- Friends Tab -->
    <div v-if="activeTab === 'friends'" class="friends__list">
      <div v-if="friendsList?.friends?.length" v-for="(friend, index) in friendsList.friends" :key="index" class="friends__item">
        <router-link :to="'/profile/' + friend.id">
          <div class="friends__item-image-wrapper">
            <img v-if="friend.image" class="friends__item-image" :src="getFriendImageUrl(friend)" :alt="friend.firstname">
          </div>
          <div class="friends__item-text">{{ friend.username }}</div>
        </router-link>
        <div class="friends__item-action">
          <button @click="removeFriend(friend.id)">Remove</button>
        </div>
      </div>
      <p v-else class="friends__no-result">No friends found</p>
    </div>

    <!-- Pending Tab -->
    <div v-if="activeTab === 'pending'" class="friends__list">
      <div v-if="friendsList?.pending?.length" v-for="(friend, index) in friendsList.pending" :key="index" class="friends__item">
        <router-link :to="'/profile/' + friend.id">
          <div class="friends__item-image-wrapper">
            <img v-if="friend.image" class="friends__item-image" :src="getFriendImageUrl(friend)" :alt="friend.firstname">
          </div>
          <div class="friends__item-text">{{ friend.username }}</div>
        </router-link>
        <div class="friends__item-action">
          <button @click="cancelFriendRequest(friend.id)">Cancel</button>
        </div>
      </div>
      <p v-else class="friends__no-result">No pending requests</p>
    </div>

    <!-- Waiting Tab -->
    <div v-if="activeTab === 'waiting'" class="friends__list">
      <div v-if="friendsList?.waiting?.length" v-for="(friend, index) in friendsList.waiting" :key="index" class="friends__item">
        <router-link :to="'/profile/' + friend.id">
          <div class="friends__item-image-wrapper">
            <img v-if="friend.image" class="friends__item-image" :src="getFriendImageUrl(friend)" :alt="friend.firstname">
          </div>
          <div class="friends__item-text">{{ friend.username }}</div>
        </router-link>
        <div class="friends__item-action">
          <button @click="rejectFriendRequest(friend.id)">Reject</button>
          <button @click="acceptFriendRequest(friend.id)">Accept</button>
        </div>
      </div>
      <p v-else class="friends__no-result">No waiting requests</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/components/friends.scss';
</style>
