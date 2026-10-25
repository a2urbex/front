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
    <span class="demo-banner__tag">DEMO ACCOUNT</span>
    <span class="demo-banner__text">All data is fake, no real location</span>
    <button class="demo-banner__exit" @click="exit">Exit</button>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;
.demo-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  height: $demoBarHeight;
  padding: 0 12px;
  background: repeating-linear-gradient(-45deg, #1a1408 0 8px, #141005 8px 16px);
  border-top: 1px solid color-mix(in srgb, var(--tint) 50%, transparent);
  color: #e8d9c2;
  font: 500 10px $font-mono;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  &__tag { color: $primary; font-weight: 600; }
  &__text { flex: 1; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; }
  &__exit { background: none; border: 0; color: #e8d9c2; font: inherit; text-decoration: underline; cursor: pointer; }
  // la nav mobile impose font-size à ses enfants directs
  .header-mobile & { font-size: 10px !important; justify-content: flex-start !important; }
  .header-desktop & {
    height: auto; flex-wrap: wrap; row-gap: 6px; margin: 0 16px 12px; padding: 12px 14px;
    border: 1px solid $primary; font-size: 11px; white-space: normal; overflow: visible;
    .demo-banner__tag { flex: 1; font-size: 12px; }
    .demo-banner__text { order: 3; flex-basis: 100%; line-height: 1.5; overflow: visible; text-overflow: clip; }
  }
}
</style>
