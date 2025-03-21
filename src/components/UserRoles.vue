<script setup>
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from '@/stores/users';

const props = defineProps({
    roles: {
        type: Array,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    }
});

const router = useRouter();
const usersStore = useUsersStore();
const emit = defineEmits(['update:roles', 'close']);

const toggleRole = (role) => {
    const currentRoles = Array.isArray(props.roles) ? props.roles : [];
    const newRoles = currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];
    emit('update:roles', newRoles);
    const query = { ...router.currentRoute.value.query };
    query.roles = newRoles.join(',');
    router.push({ query });
};

const handleOverlayClick = (event) => {
    // Only close if clicking the overlay itself, not its children
    if (event.target.classList.contains('user-roles-overlay')) {
        emit('close');
    }
};

const handleDeleteUser = async () => {
    if (confirm(`Are you sure you want to delete user ${props.username}?`)) {
        try {
            await usersStore.deleteUser(props.userId);
            emit('close');
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
};
</script>

<template>
    <div class="user-roles-overlay" @click="handleOverlayClick">
        <div class="user-roles" style="animation: fadeIn 0.1s ease-in">
            <div class="user-roles__header">
                <p class="user-roles__header-username">{{ props.username }}</p>
                <button class="user-roles__header-close" @click="emit('close')">
                    <font-awesome-icon :icon="['fa', 'xmark']" />
                </button>
            </div>
            <div class="user-roles__roles">
                <div class="role-checkbox">
                    <input 
                        type="checkbox" 
                        id="role-user" 
                        :checked="roles.includes('ROLE_USER')"
                        @change="toggleRole('ROLE_USER')"
                    >
                    <label for="role-user">User</label>
                </div>
                <div class="role-checkbox">
                    <input 
                        type="checkbox" 
                        id="role-superuser" 
                        :checked="roles.includes('ROLE_SUPERUSER')"
                        @change="toggleRole('ROLE_SUPERUSER')"
                    >
                    <label for="role-superuser">Superuser</label>
                </div>
                <div class="role-checkbox">
                    <input 
                        type="checkbox" 
                        id="role-admin" 
                        :checked="roles.includes('ROLE_ADMIN')"
                        @change="toggleRole('ROLE_ADMIN')"
                    >
                    <label for="role-admin">Admin</label>
                </div>
            </div>

            <button class="user-roles__delete-button" @click="handleDeleteUser">Delete User</button>
        </div>
    </div>
</template>

<style scoped>
    @import '@/assets/styles/components/userRoles.scss';
</style>