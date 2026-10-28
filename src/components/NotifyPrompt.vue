<script setup>
import { ref } from 'vue';
import { isStandalone } from '@/utilities/pwa';
import { enablePush } from '@/services/push';
import { toast } from 'vue3-toastify';

const KEY = 'a2-notify-dismissed';
let dismissed = false;
try { dismissed = localStorage.getItem(KEY) === '1'; } catch {}

// Seulement dans l'app installée (iOS 16.4+ exige le standalone et un tap utilisateur)
const show = ref(isStandalone() && 'Notification' in window && Notification.permission === 'default' && !dismissed);
const busy = ref(false);

const enable = async () => {
  busy.value = true;
  try {
    await enablePush();
  } catch (e) {
    toast.error(e.message, { position: toast.POSITION.TOP_CENTER, autoClose: 5000, theme: 'dark' });
  } finally {
    busy.value = false;
    show.value = false;
  }
};

const dismiss = () => {
  try { localStorage.setItem(KEY, '1'); } catch {}
  show.value = false;
};
</script>

<template>
  <transition name="notify-drop" appear>
    <div class="notify-prompt" v-if="show" role="dialog" aria-labelledby="notify-title">
      <div class="notify-prompt__head">
        <span class="notify-prompt__icon" aria-hidden="true"><font-awesome-icon :icon="['fas', 'bell']" /></span>
        <div class="notify-prompt__text">
          <b id="notify-title">Turn on notifications</b>
          <span>Get told about new spots and outings with your friends.</span>
        </div>
      </div>
      <div class="notify-prompt__actions">
        <button class="notify-prompt__btn" @click="dismiss">Not now</button>
        <button class="notify-prompt__btn notify-prompt__btn--tint" :disabled="busy" @click="enable">{{ busy ? 'Turning on…' : 'Turn on' }}</button>
      </div>
    </div>
  </transition>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;
// Demande de notifications : bannière iOS (verre sombre arrondi), comme les notifications in-app
.notify-prompt {
  position: fixed; z-index: 2000; top: calc(8px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%);
  width: min(400px, calc(100vw - 24px)); display: grid; gap: 12px; padding: 14px; border-radius: 18px;
  background: rgba(38, 38, 40, 0.9); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), inset 0 0 0 0.5px rgba(255, 255, 255, 0.1);
  color: $label; font-family: $font-body;
  &__head { display: flex; align-items: flex-start; gap: 12px; }
  &__icon {
    flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px;
    background: color-mix(in srgb, var(--tint) 20%, transparent); color: $primary; font-size: 16px;
  }
  &__text { display: grid; gap: 2px; b { font: 600 15px/20px $font-body; } span { font: 400 14px/19px $font-body; color: $label-2; } }
  &__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  &__btn {
    height: 38px; border: 0; border-radius: 10px; background: rgba(118, 118, 128, 0.24); color: $label;
    font: 600 15px $font-body; cursor: pointer;
    &--tint { background: $primary; color: var(--on-tint); }
    &:disabled { opacity: 0.6; }
    &:active { opacity: 0.8; }
  }
}
.notify-drop-enter-active { transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.1), opacity 0.25s ease; }
.notify-drop-enter-from { opacity: 0; transform: translate(-50%, -110%); }
@media (prefers-reduced-motion: reduce) { .notify-drop-enter-active { transition: opacity 0.2s; } .notify-drop-enter-from { transform: translateX(-50%); } }
</style>
