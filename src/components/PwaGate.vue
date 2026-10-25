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
      <div class="pwa-gate__head"><img class="pwa-gate__icon" src="/logox192.png" alt="" /><span>a2urbex</span></div>

      <template v-if="variant === 'inapp'">
        <h2 class="pwa-gate__title">Open in {{ ios ? 'Safari' : 'Chrome' }}</h2>
        <p class="pwa-gate__text" v-if="ios">
          On iPhone, a2urbex can only be installed from <b>Safari</b>. {{ app }} can't do it.
        </p>
        <p class="pwa-gate__text" v-else>
          You are inside the {{ app }} browser. a2urbex can't be installed from here.
        </p>
        <ol class="pwa-gate__steps">
          <li><span class="pwa-gate__num">1</span><span class="pwa-gate__step">Tap <b>Copy link</b> below.</span></li>
          <li><span class="pwa-gate__num">2</span><span class="pwa-gate__step">Open <b>{{ ios ? 'Safari' : 'Chrome' }}</b> and paste it in the address bar.</span></li>
        </ol>
        <button class="pwa-gate__btn" @click="copyLink">Copy link</button>
      </template>

      <template v-else-if="variant === 'ios'">
        <h2 class="pwa-gate__title">Install the app</h2>
        <p class="pwa-gate__text">Map and field mode only work from the home screen app.</p>
        <ol class="pwa-gate__steps">
          <li>
            <span class="pwa-gate__num">1</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 11v9h14v-9" /></svg>
            <span class="pwa-gate__step">Tap <b>Share</b> in Safari.</span>
          </li>
          <li>
            <span class="pwa-gate__num">2</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></svg>
            <span class="pwa-gate__step">Scroll and tap <b>Add to Home Screen</b>.</span>
          </li>
          <li>
            <span class="pwa-gate__num">3</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
            <span class="pwa-gate__step">Tap <b>Add</b>, then open a2urbex from your home screen.</span>
          </li>
        </ol>
        <p class="pwa-gate__note">You'll need to log in once more in the installed app.</p>
      </template>

      <template v-else>
        <h2 class="pwa-gate__title">Install the app</h2>
        <p class="pwa-gate__text">Map and field mode only work from the installed app.</p>
        <button v-if="installPrompt" class="pwa-gate__btn" @click="install">Install a2urbex</button>
        <ol v-else class="pwa-gate__steps">
          <li><span class="pwa-gate__num">1</span><span class="pwa-gate__step">Open the Chrome menu <b>⋮</b>.</span></li>
          <li><span class="pwa-gate__num">2</span><span class="pwa-gate__step">Tap <b>Install app</b> or <b>Add to Home screen</b>.</span></li>
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

// Installation de l'app : feuille sombre arrondie, étapes en liste groupée, comme le reste de l'app
.pwa-gate {
  position: fixed; inset: 0; z-index: 3000; display: flex; align-items: flex-end;
  padding: 16px 12px calc(96px + env(safe-area-inset-bottom, 0px));
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  color: $label; font-family: $font-body;

  &__panel {
    width: 100%; max-width: 420px; margin: 0 auto; padding: 18px 16px 12px; border-radius: 18px;
    background: $bg-2; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    animation: pwa-rise 0.25s ease-out;
  }
  &__head { display: flex; align-items: center; gap: 10px; margin: 0 0 14px; color: $label-2; font: 600 13px $font-body; }
  &__icon { width: 32px; height: 32px; border-radius: 8px; background: $bg-3; }
  &__title { margin: 0 0 6px; font: 700 22px/28px $font-display; letter-spacing: -0.01em; color: $label; text-transform: none; }
  &__text { margin: 0 0 14px; color: $label-2; font-size: 15px; line-height: 20px; b { color: $label; } }
  &__steps {
    margin: 0 0 14px; padding: 0; list-style: none; overflow: hidden; border-radius: 12px; background: $bg-3;
    li { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 8px 14px; font-size: 15px; line-height: 20px; }
    li + li { box-shadow: inset 0 0.5px 0 $separator; }
    b { font-weight: 600; }
    svg { width: 22px; height: 22px; flex: none; fill: none; stroke: $label-2; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  }
  &__step { flex: 1; min-width: 0; }
  &__num {
    flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%;
    background: color-mix(in srgb, var(--tint) 18%, transparent); color: $primary; font: 700 13px $font-body;
  }
  &__btn { width: 100%; height: 50px; margin: 0 0 4px; border: 0; border-radius: 12px; background: $primary; color: var(--on-tint); font: 600 17px $font-body; cursor: pointer; &:active { opacity: 0.8; } }
  &__note { margin: 0; padding: 0 2px; font: 400 13px/18px $font-body; color: $label-2; }
  &__escape { display: block; margin: 10px auto 0; padding: 8px; background: none; border: 0; color: $primary; font: 400 15px $font-body; cursor: pointer; }

  // Flèche vers le bouton Partager (barre du bas sur iPhone, en haut à droite sur iPad)
  &__arrow {
    position: fixed; left: 50%; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); width: 24px; height: 72px; margin-left: -12px;
    animation: pwa-arrow 1.2s ease-in-out infinite;
    svg { width: 100%; height: 100%; fill: none; stroke: $primary; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
    &.is-ipad { top: 8px; bottom: auto; left: auto; right: 90px; transform: rotate(180deg); animation-name: pwa-arrow-up; }
  }
}

@keyframes pwa-rise { from { opacity: 0; transform: translateY(16px); } }
@keyframes pwa-arrow { 50% { transform: translateY(10px); } }
@keyframes pwa-arrow-up { 0%, 100% { transform: rotate(180deg); } 50% { transform: rotate(180deg) translateY(10px); } }
@media (prefers-reduced-motion: reduce) { .pwa-gate__panel, .pwa-gate__arrow { animation: none; } }
</style>
