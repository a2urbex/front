<script setup>
import { ref, onMounted } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';

const favoritesStore = useFavoritesStore();
const input = ref(''); 

const props = defineProps({
  favorite: Object,
});

const listUser = async () => {
  if (props.favorite?.id) {
    await favoritesStore.getUserInList(props.favorite.id, input.value);
  }
};

const onKeyPress = async () => {
  await listUser();
};

const getFriendImageUrl = (friend) => {
  return friend.image
    ? `${import.meta.env.VITE_API_BASE_URL}${friend.image}`
    : '';
};

// Trigger when a friend item is clicked
const addUserToList = async (friendId) => {
  if (props.favorite?.id && friendId) {
    await favoritesStore.addUserInlist(props.favorite.id, friendId);
  }
};

onMounted(async () => {
  await listUser();
});
</script>

<template>
  <div class="favorite-friend">
    <input 
      v-model="input" 
      @keyup="onKeyPress"
      placeholder="Search.." 
    />
    <div class="favorite-friend__list">
      <div v-if="favoritesStore.friends.length > 0">
        <div 
          v-for="(friend, index) in favoritesStore.friends" 
          :key="friend.id" 
          class="favorite-friend__item"
          @click="addUserToList(friend.id)"
        >
          <div class="favorite-friend__info">
            <div class="favorite-friend__item-image">
              <img v-if="friend.image" :src="getFriendImageUrl(friend)" alt="friend image" class="favorite-friend__image" />
            </div>
            <p>{{ friend.username }}</p>
          </div>
          <font-awesome-icon  :icon="['fa', 'plus']" />
        </div>
      </div>
      
      <div v-else class="center">
        <p>No friends in the list</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@use '@/assets/styles/components/favoritesFriend.scss' as *;
</style>
