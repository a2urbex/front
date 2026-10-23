<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { toast } from 'vue3-toastify';
import { isStandalone, isMobile, isIOS, inAppBrowser, iosOtherBrowser, installPrompt, promptInstall, hasBypass, setBypass } from '@/utilities/pwa';

const route = useRoute();
const bypassed = ref(hasBypass());

const app = inAppBrowser() || iosOtherBrowser();
const ios = isIOS();
const ipad = ios && !/iPhone|iPod/.test(navigator.userAgent);

// Jamais en standalone, jamais sur desktop, jamais sur la page de connexion
const isAuthPage = computed(() => route.path === '/' || route.path.startsWith('/reset-password'));
// ?pwa-preview : force l'affichage (admins compris) pour tester le mur
const preview = new URLSearchParams(location.search).has('pwa-preview');
// Mobile hors app installée uniquement ; plus d'exemption admin (les admins sont aussi les utilisateurs terrain),
// "Already installed?" permet toujours de passer
const show = computed(() => preview || (isMobile() && !isStandalone() && !bypassed.value && !isAuthPage.value));
const variant = computed(() => (app ? 'inapp' : ios ? 'ios' : 'android'));

const install = async () => {
  if (await promptInstall()) toast.success('Installed. Open a2urbex from your home screen.', { position: toast.POSITION.TOP_CENTER, theme: 'dark' });
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied', { position: toast.POSITION.TOP_CENTER, autoClose: 1200, theme: 'dark' });
  } catch {}
};

const escape = () => {
  setBypass();
  bypassed.value = true;
};
</script>

<template>
  <div class="pwa-gate" v-if="show" role="dialog" aria-modal="true">
    <div class="pwa-gate__panel">
      <p class="pwa-gate__kicker">a2urbex / mobile</p>

      <template v-if="variant === 'inapp'">
        <h2 class="pwa-gate__title">Open in {{ ios ? 'Safari' : 'Chrome' }}</h2>
        <p class="pwa-gate__text" v-if="ios">
          On iPhone, a2urbex can only be installed from <b>Safari</b>. {{ app }} can't do it.
        </p>
        <p class="pwa-gate__text" v-else>
          You are inside the {{ app }} browser. a2urbex can't be installed from here.
        </p>
        <ol class="pwa-gate__steps">
          <li><span>01</span>Tap <b>Copy link</b> below.</li>
          <li><span>02</span>Open <b>{{ ios ? 'Safari' : 'Chrome' }}</b> and paste it in the address bar.</li>
        </ol>
        <button class="pwa-gate__btn" @click="copyLink">Copy link</button>
      </template>

      <template v-else-if="variant === 'ios'">
        <h2 class="pwa-gate__title">Install the app</h2>
        <p class="pwa-gate__text">Map and field mode only work from the home screen app.</p>
        <ol class="pwa-gate__steps">
          <li>
            <span>01</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 11v9h14v-9" /></svg>
            Tap <b>Share</b> in Safari.
          </li>
          <li>
            <span>02</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></svg>
            Scroll and tap <b>Add to Home Screen</b>.
          </li>
          <li>
            <span>03</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
            Tap <b>Add</b>, then open a2urbex from your home screen.
          </li>
        </ol>
        <p class="pwa-gate__note">You'll need to log in once more in the installed app.</p>
      </template>

      <template v-else>
        <h2 class="pwa-gate__title">Install the app</h2>
        <p class="pwa-gate__text">Map and field mode only work from the installed app.</p>
        <button v-if="installPrompt" class="pwa-gate__btn" @click="install">Install a2urbex</button>
        <ol v-else class="pwa-gate__steps">
          <li><span>01</span>Open the Chrome menu <b>⋮</b>.</li>
          <li><span>02</span>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
        </ol>
      </template>

      <button class="pwa-gate__escape" @click="escape">Already installed?</button>
    </div>

    <div v-if="variant === 'ios'" class="pwa-gate__arrow" :class="{ 'is-ipad': ipad }" aria-hidden="true">
      <svg viewBox="0 0 24 40"><path d="M12 2v32M4 26l8 10 8-10" /></svg>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/base.scss' as *;

.pwa-gate {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: flex-end;
  padding: 16px 16px calc(96px + env(safe-area-inset-bottom, 0px));
  background: rgba(8, 8, 8, 0.78);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #e8e4dc;

  &__panel {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
    padding: 22px 20px 16px;
    background: #121212;
    border-left: 3px solid $primary;
  }
  &__kicker { margin: 0 0 10px; font: 11px $font-mono; letter-spacing: .12em; text-transform: uppercase; color: #777; }
  &__title { margin: 0 0 8px; font-size: 28px; line-height: 1; text-transform: uppercase; letter-spacing: -0.01em; }
  &__text { margin: 0 0 16px; color: #aaa; font-size: 14px; }
  &__steps {
    margin: 0 0 16px;
    padding: 0;
    list-style: none;
    li { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid #262626; font-size: 14px; }
    span { font: 12px $font-mono; color: $primary; }
    svg { width: 22px; height: 22px; flex: none; fill: none; stroke: #e8e4dc; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  }
  &__btn { width: 100%; padding: 14px; border: 0; background: $primary; color: #111; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; cursor: pointer; }
  &__note { margin: 0; font: 12px $font-mono; color: #777; }
  &__escape { display: block; margin: 14px auto 0; background: none; border: 0; color: #666; font-size: 12px; text-decoration: underline; cursor: pointer; }

  // Flèche vers le bouton Partager (barre du bas sur iPhone, en haut à droite sur iPad)
  &__arrow {
    position: fixed;
    left: 50%;
    bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    width: 24px;
    height: 72px;
    margin-left: -12px;
    animation: pwa-arrow 1.2s ease-in-out infinite;
    svg { width: 100%; height: 100%; fill: none; stroke: $primary; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
    &.is-ipad { top: 8px; bottom: auto; left: auto; right: 90px; transform: rotate(180deg); animation-name: pwa-arrow-up; }
  }
}

@keyframes pwa-arrow { 50% { transform: translateY(10px); } }
@keyframes pwa-arrow-up { 0%, 100% { transform: rotate(180deg); } 50% { transform: rotate(180deg) translateY(10px); } }
</style>
