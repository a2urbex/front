<script setup>
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

const usersStore = useUsersStore();
const emit = defineEmits(['update:roles', 'close']);

const toggleRole = (role) => {
    const currentRoles = Array.isArray(props.roles) ? props.roles : [];
    const newRoles = currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];
    emit('update:roles', newRoles);
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
    <Teleport to="body">
        <div class="user-roles-overlay" @click="handleOverlayClick">
            <div class="user-roles" @click.stop>
                <div class="user-roles__header">
                    <p class="user-roles__header-username">
                        <font-awesome-icon :icon="['fa', 'user']" />
                        {{ props.username }}
                    </p>
                    <button class="user-roles__header-close" @click="emit('close')" aria-label="Close">
                        <font-awesome-icon :icon="['fa', 'xmark']" />
                    </button>
                </div>

                <p class="user-roles__hint">Toggle the roles assigned to this user.</p>

                <div class="user-roles__roles">
                    <div class="role-checkbox">
                        <input
                            type="checkbox"
                            id="role-user"
                            :checked="roles.includes('ROLE_USER')"
                            @change="toggleRole('ROLE_USER')"
                        >
                        <label for="role-user">
                            <font-awesome-icon :icon="['fa', 'shield']" class="role-checkbox__icon role-checkbox__icon--user" />
                            User
                        </label>
                    </div>
                    <div class="role-checkbox">
                        <input
                            type="checkbox"
                            id="role-superuser"
                            :checked="roles.includes('ROLE_SUPERUSER')"
                            @change="toggleRole('ROLE_SUPERUSER')"
                        >
                        <label for="role-superuser">
                            <font-awesome-icon :icon="['fa', 'shield-halved']" class="role-checkbox__icon role-checkbox__icon--superuser" />
                            Superuser
                        </label>
                    </div>
                    <div class="role-checkbox">
                        <input
                            type="checkbox"
                            id="role-admin"
                            :checked="roles.includes('ROLE_ADMIN')"
                            @change="toggleRole('ROLE_ADMIN')"
                        >
                        <label for="role-admin">
                            <font-awesome-icon :icon="['fa', 'shield']" class="role-checkbox__icon role-checkbox__icon--admin" />
                            Admin
                        </label>
                    </div>
                </div>

                <button class="user-roles__delete-button" @click="handleDeleteUser">
                    <font-awesome-icon :icon="['fa', 'trash']" />
                    Delete user
                </button>
            </div>
        </div>
    </Teleport>
</template>

<style lang="scss" scoped>
    @use '@/assets/styles/components/userRoles.scss' as *;
</style>