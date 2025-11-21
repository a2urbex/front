<script setup>
import HeaderComponent from '@/components/Header.vue';
import MapComponent from '@/components/Map.vue';
import AddLocationComponent from '@/components/LocationAdd.vue';
import { ref, watch, onMounted } from 'vue';
import { useVersionStore } from '@/stores/version';
import { useUIStore } from '@/stores/ui';
import { useRouter } from 'vue-router';

const showAddLocation = ref(false);
const showUpdatePopup = ref(false);
const versionStore = useVersionStore();
const uiStore = useUIStore();
const router = useRouter();

const toggleAddLocation = () => {
  showAddLocation.value = !showAddLocation.value;
};

watch(() => uiStore.isTransitioning, (newValue) => {
  const appElement = document.getElementById('app');
  if (appElement) {
    if (newValue) {
      appElement.classList.add('is-transitioning');
    } else {
      appElement.classList.remove('is-transitioning');
    }
  }
});

onMounted(async () => {
  await versionStore.getVersion();
});

watch(() => versionStore.status, (newStatus) => {
  if (newStatus === 'outdated') {
    showUpdatePopup.value = true;
  }
});

const goToUpdate = () => {
  showUpdatePopup.value = false;
  router.push('/app-settings');
};

</script>

<template>
  <!-- Header -->
  <HeaderComponent v-if="!uiStore.isTransitioning" @toggle-add-location="toggleAddLocation" />

  <!-- Map -->
  <MapComponent />

  <!-- Add Location -->
  <AddLocationComponent v-if="showAddLocation" @close="showAddLocation = false" />

  <!-- Content -->
  <router-view />

  <!-- Update Popup -->
  <div v-if="showUpdatePopup" class="update-popup-overlay">
    <div class="update-popup">
      <h3>Update available</h3>
      <p>A new version of the application is available.</p>
      <button @click="goToUpdate" class="update-btn">
        Update
        <font-awesome-icon :icon="['fa', 'arrow-right']" />
      </button>
    </div>
  </div>

  <!-- <div class="version-info m-none">
    <span>You are using version: {{ versionStore.code_version }}. </span>
    <span> <b>This version is still in development</b></span>
  </div> -->
</template>

<style scoped>
.update-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.update-popup {
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 0 20px rgba(255, 170, 0, 0.2);
  max-width: 90%;
  width: 350px;
}

.update-popup h3 {
  color: #ffaa00;
  margin: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.update-popup p {
  color: #ccc;
  margin-bottom: 1.5rem;
}

.update-btn {
  background: #ffaa00;
  color: #000;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.update-btn:hover {
  background: #ffcc00;
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(255, 170, 0, 0.4);
}
</style>
