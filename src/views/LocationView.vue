<script setup>
import { onMounted, computed, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLocationStore } from '@/stores/location';
import { useMapStore } from '@/stores/map';
import { useAuthStore } from '@/stores/auth';
import LocationCardDisplay from '@/components/LocationCardDisplay.vue';

// Point partagé par lien : la carte n'affiche que CE point, puis sa fiche.
// Visiteur non connecté : carte floutée et « Load map » d'abord (comme l'accueil).
const route = useRoute();
const router = useRouter();
const locationStore = useLocationStore();
const mapStore = useMapStore();
const authStore = useAuthStore();

const loggedIn = computed(() => !!authStore.token);
const location = ref(null);
const notFound = ref(false);
// la fiche s'affiche tout de suite, la carte floutée reste derrière jusqu'à « Load map »
const showCard = computed(() => location.value && mapStore.sharedCardOpen);

onMounted(async () => {
  mapStore.sharedLoaded = loggedIn.value;
  mapStore.sharedCardOpen = true;
  mapStore.setType('shared', route.params.id);
  await nextTick(); // la carte vide ses points quand le type change : on les pose après
  try {
    await locationStore.getLocation(route.params.id);
    location.value = locationStore.location?.id ? locationStore.location : null;
  } catch {
    location.value = null;
  }
  notFound.value = !location.value;
  mapStore.locations = location.value ? [location.value] : [];
});

const onClose = () => {
  if (loggedIn.value) router.push('/locations');
  else mapStore.sharedCardOpen = false; // le point reste sur la carte, un tap dessus rouvre sa fiche
};
</script>

<template>
  <div v-if="!loggedIn" class="share-chip">
    <img src="/logox192.png" alt="" />
    <span>a2urbex</span>
    <router-link to="/" class="share-chip__login">Log in</router-link>
  </div>
  <p v-if="notFound" class="share-note">This spot doesn't exist anymore, or it isn't shared.</p>
  <LocationCardDisplay v-if="showCard" :location="location" @close="onClose" />
</template>
