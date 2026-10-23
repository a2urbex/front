<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useExplorationStore } from '@/stores/exploration';
import { usePositionStore } from '@/stores/position';

const exploration = useExplorationStore();
const router = useRouter();
const confirming = ref(false);
const position = usePositionStore();
const GPS = { insecure: 'Location needs HTTPS', denied: 'Location blocked in settings', unavailable: 'No GPS signal' };
const gpsIssue = computed(() => (!position.pos ? GPS[position.error] || '' : ''));

const end = async () => {
  await exploration.end();
  confirming.value = false;
};
</script>

<template>
  <div class="exploration-bar" v-if="exploration.active">
    <span class="exploration-bar__dot"></span>
    <button class="exploration-bar__name" @click="router.push(`/favorites/${exploration.active.favoriteId}`)">
      {{ exploration.active.name || 'Exploration' }}
    </button>
    <span v-if="gpsIssue" class="exploration-bar__gps" :title="gpsIssue">⌖ {{ gpsIssue }}</span>
    <button v-if="!confirming" class="exploration-bar__end" @click="confirming = true">End</button>
    <template v-else>
      <button class="exploration-bar__end" @click="end">Confirm</button>
      <button class="exploration-bar__cancel" @click="confirming = false">✕</button>
    </template>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;
.exploration-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: $explorationBarHeight;
  padding: 0 12px;
  background: #111;
  border-top: 2px solid $primary;
  .header-desktop & { height: auto; flex-wrap: wrap; padding: 10px 12px; margin: 0 0 12px; border: 1px solid #2a2a2a; border-left: 3px solid $primary; }
  color: #eee;
  font-size: 13px;
  &__dot { width: 8px; height: 8px; flex: none; border-radius: 50%; background: $primary; animation: expl-pulse 1.6s ease infinite; }
  &__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: none; border: 0; color: inherit; font-weight: 600; text-align: left; cursor: pointer; }
  &__gps { font: 11px $font-mono; color: #e0766b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 45%; }
  &__end { padding: 6px 12px; border: 0; background: $primary; color: #111; font-weight: 700; text-transform: uppercase; font-size: 12px; cursor: pointer; }
  &__cancel { background: none; border: 0; color: #888; cursor: pointer; }
}
@keyframes expl-pulse { 50% { opacity: .3; } }
</style>
