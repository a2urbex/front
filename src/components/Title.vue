<template>
  <div class="title-container" :class="{ large: isLarge, compact: isLarge && scrolled }" ref="root">
    <button v-if="showBackButton" class="back-button" @click="goBack" aria-label="Back">
      <svg viewBox="0 0 12 20" aria-hidden="true"><path d="M10.3 1.2 1.7 10l8.6 8.8" /></svg>
      <span>Back</span>
    </button>
    <span v-else class="back-spacer"></span>
    <h2 v-appear>{{ title }}</h2>
    <span class="back-spacer"></span>
    <h1 v-if="isLarge" class="large-title">{{ title }}</h1>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { addBodyClass, removeBodyClass } from '@/utilities/bodyClass';

const router = useRouter();

const props = defineProps({
  title: {
    type: String,
    required: false,
  },
  hasPageWidth: {
    type: Boolean,
    default: true,
  },
  goHistory: {
    type: Boolean,
    default: true,
  },
});

// Retour prévisible : les onglets racine n'ont pas de retour, les sous-pages remontent à leur parent
// (l'historique navigateur saute à cause des redirections, ex. exploration)
const ROOTS = ['/', '/locations', '/favorites', '/me'];
const parentOf = (path) => {
  if (path.startsWith('/favorites/')) return '/favorites';
  if (path.startsWith('/admin/')) return '/admin';
  if (path === '/admin' || path.startsWith('/me/') || ['/friends', '/edit-profile'].includes(path)) return '/me';
  return null;
};

const showBackButton = computed(() => !props.goHistory || !ROOTS.includes(router.currentRoute.value.path));

// Pages racines des onglets (Lists, Outings, Profile) : grand titre iOS qui se réduit au défilement
const LARGE = ['/favorites', '/me'];
const isLarge = computed(() => LARGE.includes(router.currentRoute.value.path));
const scrolled = ref(false);
let scroller = null;
const onScroll = () => { scrolled.value = (scroller?.scrollTop || 0) > 28; };

// Seul le titre de page (dans .content) décale le contenu ; pas celui du menu mobile
const root = ref(null);
let counted = false;
let largeCounted = false;
onMounted(() => {
  counted = !!root.value?.closest('.content');
  if (counted) addBodyClass('has-title');
  largeCounted = counted && isLarge.value;
  if (largeCounted) addBodyClass('has-large-title');
  scroller = root.value?.closest('.content');
  scroller?.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => {
  if (counted) removeBodyClass('has-title');
  if (largeCounted) removeBodyClass('has-large-title');
  scroller?.removeEventListener('scroll', onScroll);
});

const goBack = () => {
  if (!props.goHistory) return;
  const parent = parentOf(router.currentRoute.value.path);
  const prev = (window.history.state?.back || '').split(/[?#]/)[0];
  // Si la page précédente est le parent, on revient vraiment en arrière (pas d'empilement :
  // sinon le geste « retour » du téléphone ramène sur la page qu'on vient de quitter)
  if (parent && prev === parent) router.back();
  else if (parent) router.replace(parent);
  else if (prev) router.back();
  else router.replace('/locations');
};
</script>

<style scoped>
/* Barre de navigation iOS : translucide, retour « ‹ Back » teinté à gauche, titre centré */
.title-container {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 8;
  display: grid;
  grid-template-columns: minmax(84px, 1fr) auto minmax(84px, 1fr);
  align-items: center;
  padding: 0 8px;
  background: rgba(18, 18, 20, 0.82);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow: inset 0 -0.5px 0 rgba(84, 84, 88, 0.6);
}

.back-button {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 44px;
  padding: 0 8px 0 4px;
  background: none;
  border: 0;
  color: var(--tint);
  font-size: 17px;
  cursor: pointer;
}
.back-button svg { width: 12px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.back-button:active { opacity: 0.5; }

/* Grand titre (racines d'onglets) : un seul titre, aligné à gauche, qui rétrécit en place au défilement */
.title-container.large { grid-template-rows: 0 1fr; height: calc(60px + env(safe-area-inset-top, 0px)) !important; background: #000; box-shadow: none; transition: height .22s ease, background .22s ease, box-shadow .22s ease; }
.title-container.large h2, .title-container.large .back-spacer { display: none; }
.title-container.large .large-title {
  grid-column: 1 / -1; grid-row: 2; align-self: end; justify-self: center; width: min(680px, 100%); box-sizing: border-box; margin: 0; padding: 0 8px 6px;
  font-size: 34px; line-height: 41px; font-weight: 700; letter-spacing: 0.01em; text-align: left;
  transform-origin: left bottom; transition: font-size .22s ease, padding .22s ease;
}
.title-container.large.compact { height: calc(52px + env(safe-area-inset-top, 0px)) !important; background: rgba(18, 18, 20, 0.82); box-shadow: inset 0 -0.5px 0 rgba(84, 84, 88, 0.6); }
.title-container.large.compact .large-title { font-size: 22px; line-height: 28px; padding-bottom: 12px; }

/* Ordinateur : la barre suit la colonne de contenu (680px centrée) au lieu de coller aux bords */
/* Ordinateur : titre aligné à gauche sur le contenu (48px), retour juste avant, comme une barre d'outils macOS */
@media (min-width: 990px) {
  .title-container:not(.large) { grid-template-columns: auto minmax(0, 1fr) 0; justify-content: start; gap: 4px; padding-inline: 34px 24px; }
  .title-container:not(.large) .back-spacer:first-child { width: 6px; }
  .title-container:not(.large) h2 { max-width: 100%; text-align: left; font-size: 20px; font-weight: 700; }
  .title-container.large .large-title { justify-self: start; width: auto; padding-left: 40px; }
}

h2 {
  margin: 0;
  max-width: 60vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  line-height: 22px;
  letter-spacing: -0.02em;
}
</style>
