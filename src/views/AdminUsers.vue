<script setup>
import Title from '@/components/Title.vue'
import { useUsersStore } from '@/stores/users'
import { computed, onMounted, ref } from 'vue'
import UserRoles from '@/components/UserRoles.vue'
import UserRoleBadge from '@/components/UserRoleBadge.vue'

const usersStore = useUsersStore()
const selectedUserId = ref(null)

const getUserImageUrl = (user) => {
  return user.image
    ? `${import.meta.env.VITE_API_BASE_URL}${user.image}`
    : '/default-user.png';
};

const isPending = (user) => Number(user.pending) === 1;

const pendingUsers = computed(() => usersStore.users.filter(isPending));
const approvedUsers = computed(() => usersStore.users.filter(u => !isPending(u)));

const toggleUserRoles = (userId) => {
  selectedUserId.value = selectedUserId.value === userId ? null : userId;
};

const updateUserRoles = async (userId, newRoles) => {
  try {
    await usersStore.updateRoles(userId, {
      roles: newRoles
    });
  } catch (error) {
    console.error('Failed to update user roles:', error);
  }
};

const approveUser = async (user) => {
  const currentRoles = Array.isArray(user.roles) ? user.roles : [];
  const nextRoles = Array.from(new Set([...currentRoles, 'ROLE_SUPERUSER']));
  try {
    await usersStore.approveUser(user.id, nextRoles);
  } catch (error) {
    console.error('Failed to approve user:', error);
  }
};

const rejectUser = async (user) => {
  if (!confirm(`Reject access request from ${user.username}?`)) return;
  try {
    await usersStore.updatePending(user.id, 0);
  } catch (error) {
    console.error('Failed to reject user:', error);
  }
};

onMounted(async () => {
  await usersStore.getAll()
})
</script>
<template>
   <Title title="Account Management" />

   <div class="admin-page page-width">
    <div v-if="usersStore.loading" class="loading">
      Loading users...
    </div>

    <template v-else>
      <section class="admin-page__section" v-if="pendingUsers.length">
        <div class="admin-page__section-header">
          <h3>Access requests</h3>
          <span class="admin-page__badge">{{ pendingUsers.length }} pending</span>
        </div>
        <p class="admin-page__section-hint">
          These users registered and are awaiting approval. Approve to grant Superuser access, or reject to dismiss the request.
        </p>

        <div class="admin-page__users">
          <div
            v-for="user in pendingUsers"
            :key="user.id"
            class="admin-page__user admin-page__user--pending"
          >
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
              <div class="admin-page__user-info-username">
                <span class="username-text">{{ user.username }}</span>
                <UserRoleBadge :roles="user.roles" />
              </div>
              <div class="admin-page__user-info-email">{{ user.email }}</div>
            </div>

            <div class="admin-page__user-actions">
              <button
                class="admin-page__action admin-page__action--approve"
                @click="approveUser(user)"
                title="Approve as Superuser"
              >
                <font-awesome-icon :icon="['fa', 'check']" />
                <span>Approve</span>
              </button>
              <button
                class="admin-page__action admin-page__action--reject"
                @click="rejectUser(user)"
                title="Reject access request"
              >
                <font-awesome-icon :icon="['fa', 'xmark']" />
                <span>Reject</span>
              </button>
              <button
                class="admin-page__user-actions-button"
                @click="toggleUserRoles(user.id)"
                :class="{ 'active': selectedUserId === user.id }"
                title="Edit roles"
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
      </section>

      <section class="admin-page__section">
        <div class="admin-page__section-header">
          <h3>User editor</h3>
          <span class="admin-page__badge admin-page__badge--muted">{{ approvedUsers.length }} Checked</span>
        </div>

        <div v-if="!approvedUsers.length" class="admin-page__empty">
          No approved users yet.
        </div>

        <div v-else class="admin-page__users">
          <div v-for="user in approvedUsers" :key="user.id" class="admin-page__user">
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
              <div class="admin-page__user-info-username">
                <span class="username-text">{{ user.username }}</span>
                <UserRoleBadge :roles="user.roles" />
              </div>
              <div class="admin-page__user-info-email">{{ user.email }}</div>
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
      </section>
    </template>
   </div>
</template>

<style lang="scss" scoped>
    @use '@/assets/styles/components/admin.scss' as *;
</style>
