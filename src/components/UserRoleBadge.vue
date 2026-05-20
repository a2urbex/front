<script setup>
import { computed } from 'vue';

const props = defineProps({
  roles: {
    type: [Array, String],
    default: () => []
  }
});

const normalizedRoles = computed(() => {
  let r = props.roles;
  if (r == null) return [];
  if (typeof r === 'string') {
    try { r = JSON.parse(r); }
    catch { r = r.split(',').map(s => s.trim()); }
  }
  if (!Array.isArray(r)) return [];
  return r.map(v => String(v).trim().toUpperCase());
});

const level = computed(() => {
  const r = normalizedRoles.value;
  if (r.includes('ROLE_ADMIN')) return 'admin';
  if (r.includes('ROLE_SUPERUSER')) return 'superuser';
  return 'user';
});

const icon = computed(() => {
  if (level.value === 'superuser') return ['fa', 'shield-halved'];
  return ['fa', 'shield'];
});
</script>

<template>
  <span class="user-role-badge" :class="`user-role-badge--${level}`">
    <font-awesome-icon :icon="icon" />
  </span>
</template>

<style scoped lang="scss">
.user-role-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 0.4rem;
  font-size: 0.85em;
  vertical-align: middle;

  &--admin { color: #d4af37; }
  &--superuser { color: #ffffff; }
  &--user { color: rgba(255, 255, 255, 0.3); }
}
</style>
