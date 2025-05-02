<script setup>
import Title from '@/components/Title.vue'
import { useUsersStore } from '@/stores/users'
import { onMounted, ref } from 'vue'
import UserRoles from '@/components/UserRoles.vue'
import { useRouter } from 'vue-router'

const usersStore = useUsersStore()
const selectedUserId = ref(null)
const router = useRouter()

const getUserImageUrl = (user) => {
  return user.image
    ? `${import.meta.env.VITE_API_BASE_URL}${user.image}`
    : '/default-user.png';
};

const toggleUserRoles = (userId) => {
  selectedUserId.value = selectedUserId.value === userId ? null : userId;
  if (userId) {
    const user = usersStore.users.find(u => u.id === userId);
    if (user) {
      router.push({ query: { userId, roles: user.roles.join(',') } });
    }
  } else {
    router.push({ query: {} });
  }
};

const updateUserRoles = async (userId, newRoles) => {
  try {
    // Send the roles in the exact format required by the API
    await usersStore.updateRoles(userId, {
      roles: newRoles
    });
  } catch (error) {
    console.error('Failed to update user roles:', error);
    // You might want to add error handling here, like showing a notification
  }
};

onMounted(async () => {
  await usersStore.getAll()
})
</script>
<template>
   <Title title="Admin" />

   <div class="admin-page page-width">
    <a class="admin-page__legacy" href="https://gestion.a2urbex.eu" target="_blank">Access legacy admin</a>
    <h3>User editor</h3>
    
    <div v-if="usersStore.loading" class="loading">
      Loading users...
    </div>
    
    <div v-else class="admin-page__users">
        <div v-for="user in usersStore.users" :key="user.id" class="admin-page__user">
            <img 
                v-if="user.image"
                :src="getUserImageUrl(user)" 
                :alt="user.username"
                class="admin-page__user-image"
                />
                <div v-else class="admin-page__user-image-placeholder">
                <font-awesome-icon :icon="['fa', 'user']" />
            </div>
          <div class="admin-page__user-info">
            <div class="admin-page__user-info-username">{{ user.username }}</div>
            <div class="admin-page__user-info-email">{{ user.email }}</div>
            <!-- <div>{{ user.roles }}</div> -->
          </div>
          <div class="admin-page__user-actions">
            <button 
              class="admin-page__user-actions-button"
              @click="toggleUserRoles(user.id)"
              :class="{ 'active': selectedUserId === user.id }"
            >
               <font-awesome-icon :icon="['fa', 'gear']" />
            </button>
          </div>
          <UserRoles 
            v-if="selectedUserId === user.id" 
            :roles="user.roles" 
            :username="user.username"
            :userId="user.id"
            @update:roles="(newRoles) => updateUserRoles(user.id, newRoles)"
            @close="toggleUserRoles(null)"
          />
        </div>
    </div>
   </div>
</template>

<style lang="scss" scoped>
    @import '@/assets/styles/components/admin.scss';
</style> 

