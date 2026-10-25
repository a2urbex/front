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
// Barre « exploration en cours » : rangée iOS posée sur la barre d'onglets (comme le mini-lecteur de Musique)
.exploration-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: $explorationBarHeight;
  padding: 0 10px 0 14px;
  background: transparent;
  box-shadow: inset 0 -0.5px 0 $separator;
  color: $label;
  font: 400 15px/20px $font-body;
  .header-desktop & { height: auto; flex-wrap: wrap; padding: 10px 12px; margin: 0 0 12px; background: $bg-2; border-radius: 10px; box-shadow: none; }
  &__dot { width: 8px; height: 8px; flex: none; border-radius: 50%; background: $primary; box-shadow: 0 0 0 4px color-mix(in srgb, var(--tint) 18%, transparent); animation: expl-pulse 2s ease infinite; }
  &__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: none; border: 0; color: inherit; font: 600 15px/20px $font-body; text-align: left; cursor: pointer; }
  &__gps { font-size: 12px; color: $red; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 45%; }
  &__end { height: 30px; padding: 0 14px; border: 0; border-radius: 15px; background: $fill; color: $label; font: 600 14px $font-body; cursor: pointer; }
  &__cancel { width: 30px; height: 30px; border: 0; border-radius: 15px; background: $fill; color: $label-2; cursor: pointer; }
}
@keyframes expl-pulse { 50% { opacity: .45; } }
</style>
