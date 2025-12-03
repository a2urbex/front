<script setup>
import { onMounted, computed, ref } from 'vue';
import { useUsersStore } from '@/stores/users';
import PreLoader from '../components/PreLoader.vue';
import { toast } from 'vue3-toastify';

const usersStore = useUsersStore();
const searchQuery = ref('');
const isInputFocused = ref(false);

const filteredUsers = computed(() => {
  if (!searchQuery.value) return usersStore.users;
  const query = searchQuery.value.toLowerCase();
  return usersStore.users.filter(user => 
    user.username.toLowerCase().includes(query)
  );
});

const getUserImageUrl = (user) => {
  return user.image
    ? `${import.meta.env.VITE_API_BASE_URL}${user.image}`
    : '/default-user.png';
};

onMounted(async () => {
  try {
    await usersStore.getAll();
  } catch (error) {
    toast.error('Failed to fetch users', { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
  }
});
</script>

<template>
    <div class="user-search">
        <div class="user-search__input-wrapper">
            <input 
                v-model="searchQuery"
                type="text"
                placeholder="Search users..."
                class="user-search__input"
                @focus="isInputFocused = true"
            />
            <span v-if="isInputFocused" class="user-search__input-cancel" @click="searchQuery = ''; isInputFocused = false" style="animation: fadeIn 0.1s ease-in">Cancel</span>
            <font-awesome-icon :icon="['fa', 'magnifying-glass']" />
        </div>
        
        <div v-if="isInputFocused" class="user-search__list" style="animation: fadeIn 0.1s ease-in">
            <PreLoader v-if="usersStore.loading" />
            <template v-else>
                <div v-if="filteredUsers.length > 0" class="user-search__items">
                    <router-link 
                        :to="'/profile/' + user.id"
                        v-for="user in filteredUsers" 
                        :key="user.id" 
                        class="user-search__item"
                    >
                        <div class="user-search__item-image">
                            <img 
                                v-if="user.image"
                                :src="getUserImageUrl(user)" 
                                :alt="user.username"
                                class="user-search__image"
                            />
                            <div v-else class="user-search__image-placeholder">
                                <font-awesome-icon :icon="['fa', 'user']" />
                            </div>
                        </div>
                        <span class="user-search__username">{{ user.username }}</span>
                    </router-link>
                </div>
                <div v-else class="user-search__no-result">
                    No users found
                </div>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @use '@/assets/styles/components/users.scss' as *;
</style>
