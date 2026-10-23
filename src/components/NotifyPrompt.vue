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
  <div class="notify-prompt" v-if="show">
    <span class="notify-prompt__text">Get notified about new spots and outings.</span>
    <button class="notify-prompt__btn" :disabled="busy" @click="enable">Enable notifications</button>
    <button class="notify-prompt__close" @click="dismiss" aria-label="Dismiss">✕</button>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;
.notify-prompt {
  position: fixed;
  top: calc(8px + env(safe-area-inset-top, 0px));
  left: 8px;
  right: 8px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #121212;
  border-left: 3px solid $primary;
  color: #ddd;
  font-size: 13px;
  &__text { flex: 1; }
  &__btn { padding: 8px 10px; border: 0; background: $primary; color: #111; font-weight: 700; cursor: pointer; }
  &__close { background: none; border: 0; color: #777; cursor: pointer; }
}
</style>
