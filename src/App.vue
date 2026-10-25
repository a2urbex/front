<script setup>
import { forceAppUpdate } from '@/utilities/appUpdate';
import HeaderComponent from '@/components/Header.vue';
import MapComponent from '@/components/Map.vue';
import AddLocationComponent from '@/components/LocationAdd.vue';
import PwaGate from '@/components/PwaGate.vue';
import NotifyPrompt from '@/components/NotifyPrompt.vue';
import { useAuthStore } from '@/stores/auth';
import { useExplorationStore } from '@/stores/exploration';
import { usePositionStore } from '@/stores/position';
import { isDemo } from '@/demo/session';
import { ref, watch, onMounted } from 'vue';
import { useVersionStore } from '@/stores/version';
import { useUIStore } from '@/stores/ui';
import { useRouter } from 'vue-router';

const showAddLocation = ref(false);
const showUpdatePopup = ref(false);
const versionStore = useVersionStore();
const uiStore = useUIStore();
const router = useRouter();
const authStore = useAuthStore();
const demo = isDemo();
const explorationStore = useExplorationStore();

const positionStore = usePositionStore();
if (isDemo()) {
  document.body.classList.add('is-demo');
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, nofollow';
  document.head.appendChild(robots);
}
watch(() => explorationStore.active, (a) => {
  document.body.classList.toggle('exploring', !!a);
  if (a) positionStore.start();
  else positionStore.stop();
}, { immediate: true });

// "Add a location" depuis l'onglet Profil
window.addEventListener('a2:add-location', () => { showAddLocation.value = true; });

// Rôle changé par un admin : le profil se met à jour au retour au premier plan, sans reconnexion
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && authStore.token) authStore.fetchUserProfile().catch(() => {});
});

watch(() => authStore.token, (token) => {
  if (token) explorationStore.fetch().then(() => {
    const a = explorationStore.active;
    if (a && router.currentRoute.value.path === '/locations') router.replace(`/favorites/${a.favoriteId}`);
  });
  else explorationStore.active = null;
}, { immediate: true });

const toggleAddLocation = () => {
  showAddLocation.value = !showAddLocation.value;
};

watch(
  () => uiStore.isTransitioning,
  (newValue) => {
    const appElement = document.getElementById('app');
    if (appElement) {
      if (newValue) {
        appElement.classList.add('is-transitioning');
      } else {
        appElement.classList.remove('is-transitioning');
      }
    }
  },
);

onMounted(async () => {
  await versionStore.getVersion();
});

watch(
  () => versionStore.status,
  (newStatus) => {
    if (newStatus === 'outdated') {
      showUpdatePopup.value = true;
    }
  },
);

// Met à jour directement (vide les caches et recharge), sans passer par le Profil
const updating = ref(false);
const goToUpdate = async () => {
  updating.value = true;
  await forceAppUpdate();
};
</script>

<template>
  <!-- Header -->
  <HeaderComponent v-if="!uiStore.isTransitioning" @toggle-add-location="toggleAddLocation" />

  <!-- Map -->
  <MapComponent />

  <PwaGate v-if="!demo" />
  <NotifyPrompt v-if="authStore.token && !demo" />

  <!-- Add Location -->
  <AddLocationComponent v-if="showAddLocation" @close="showAddLocation = false" />

  <!-- Content -->
  <div class="content">
    <router-view />
  </div>

  <!-- Update Popup -->
  <div v-if="showUpdatePopup" class="ui-dialog-backdrop" @click.self="showUpdatePopup = false">
    <div class="ui-dialog" role="alertdialog" aria-labelledby="update-title">
      <h3 id="update-title">Update available</h3>
      <p>Version {{ versionStore.latest_version }} is ready. Update now to get the latest changes.</p>
      <div class="ui-dialog__actions">
        <button class="ui-dialog__btn" @click="showUpdatePopup = false">Later</button>
        <button class="ui-dialog__btn is-primary" :disabled="updating" @click="goToUpdate">{{ updating ? 'Updating…' : 'Update' }}</button>
      </div>
    </div>
  </div>

  <!-- <div class="version-info m-none">
    <span>You are using version: {{ versionStore.code_version }}. </span>
    <span> <b>This version is still in development</b></span>
  </div> -->
</template>

