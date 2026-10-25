<script setup>
import { isDemo, stopDemo } from '@/demo/session';

const demo = isDemo();
const exit = () => {
  stopDemo();
  window.location.replace('/');
};
</script>

<template>
  <div class="demo-banner" v-if="demo" role="status">
    <span class="demo-banner__dot" aria-hidden="true"></span>
    <span class="demo-banner__tag">Demo account</span>
    <span class="demo-banner__text">Everything here is fake, no real place.</span>
    <button class="demo-banner__exit" @click="exit">Exit demo</button>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;
// Bandeau démo : sobre, jaune système en accent, typo de l'app
.demo-banner {
  display: flex; align-items: center; gap: 8px; height: $demoBarHeight; padding: 0 12px 0 14px;
  background: rgba(255, 214, 10, 0.1); box-shadow: inset 0 0.5px 0 rgba(255, 214, 10, 0.25);
  color: $label-2; font: 400 12px $font-body; white-space: nowrap; overflow: hidden;
  &__dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: #ffd60a; }
  &__tag { color: #ffd60a; font-weight: 600; }
  &__text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  &__exit { flex: none; padding: 0; border: 0; background: none; color: #ffd60a; font: 600 12px $font-body; cursor: pointer; }
  // la nav mobile impose font-size à ses enfants directs
  .header-mobile & { font-size: 12px !important; justify-content: flex-start !important; }
  // barre latérale : petite carte
  .header-desktop & {
    height: auto; flex-wrap: wrap; row-gap: 4px; margin: 4px 12px 0; padding: 12px 14px; border-radius: 10px; box-shadow: none;
    white-space: normal; overflow: visible;
    .demo-banner__tag { flex: 1; font-size: 13px; }
    .demo-banner__text { order: 3; flex-basis: 100%; font-size: 12px; line-height: 16px; overflow: visible; }
    .demo-banner__exit { order: 4; margin-top: 6px; height: 26px; padding: 0 12px; border-radius: 13px; background: rgba(255, 214, 10, 0.16); }
  }
}
</style>
