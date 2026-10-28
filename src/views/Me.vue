<script setup>
import { navSource } from '@/utilities/deskPanel';
import { computed, ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import Title from '@/components/Title.vue';
import { request } from '@/services/api';
import { cached, remember } from '@/utilities/sessionCache';
import { apiImage } from '@/utilities/apiImage';
import { forceAppUpdate } from '@/utilities/appUpdate';
import { resolveDefaultCountry } from '@/stores/filter';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import { useVersionStore } from '@/stores/version';
import { useExplorationStore } from '@/stores/exploration';
import { enablePush, disablePush, pushSupported, resetPush } from '@/services/push';
import { isDemo } from '@/demo/session';
import { getAccent } from '@/utilities/accent';

// Onglet Profil : remplace le menu latéral, App Settings et le hub admin
const authStore = useAuthStore();
const versionStore = useVersionStore();
const updating = ref(false);
const updateNow = async () => { updating.value = true; await forceAppUpdate(); };
const exploration = useExplorationStore();
const usersStore = useUsersStore();
const demo = isDemo();
const TOAST = { position: toast.POSITION.TOP_CENTER, theme: 'dark' };

const me = computed(() => authStore.userProfile || {});
const isAdmin = computed(() => !!me.value.isAdmin);
const avatar = computed(() => apiImage(me.value.image));
const avatarBroken = ref(false);
const initials = computed(() => (me.value.username || '?').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase());

// Pays par défaut
const country = ref(cached('me:country') || null);
const countrySetting = ref(country.value?.setting || '');
// Couleur d'accent (réglée dans Appearance)
const accentNow = getAccent();

const SOURCE = { account: 'chosen', geolocation: 'from GPS', ip: 'from IP', language: 'from browser', default: 'default' };
const countryName = computed(() => country.value?.countries?.find((c) => c.code === country.value.code)?.name || country.value?.code || '');
const saveCountry = async () => {
  await request('PUT', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}/country`, { code: countrySetting.value || null });
  country.value = remember('me:country', await resolveDefaultCountry());
};


// Notifications
const prefs = ref([]);
const pushOn = ref(false);
const canPush = pushSupported();
const busy = ref('');
const loadPush = async () => {
  prefs.value = (await request('GET', '/push/preferences')) || [];
  if (canPush) pushOn.value = Notification.permission === 'granted' && !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription());
};
const togglePush = async () => {
  try {
    if (pushOn.value) await disablePush();
    else if (!(await enablePush())) toast.error('Notifications were not allowed on this device.', TOAST);
  } catch (e) {
    toast.error(e.message, { ...TOAST, autoClose: 5000 });
  }
  await loadPush();
};
const togglePref = async (p) => {
  if (p.critical) return;
  p.enabled = !p.enabled;
  await request('PUT', '/push/preferences', { channel: p.channel, enabled: p.enabled });
};
const testPush = async () => {
  busy.value = 'test';
  try {
    const res = await request('POST', '/push/test');
    const msg = res.error ? `Test failed: ${res.error}` : res.sent ? `Test sent to ${res.sent} device(s).` : 'No device registered. Turn "This device" on first.';
    (res.sent && !res.error ? toast.success : toast.error)(msg, { ...TOAST, autoClose: 5000 });
  } finally {
    busy.value = '';
  }
};
const resetNotifications = async () => {
  busy.value = 'reset';
  try {
    if (!(await resetPush())) throw new Error(Notification.permission === 'denied' ? 'Notifications are blocked for this app. Allow them in the phone settings, then try again.' : 'Notifications were not allowed.');
    toast.success('Notifications re-registered on this device.', TOAST);
  } catch (e) {
    toast.error(e.message, { ...TOAST, autoClose: 6000 });
  } finally {
    busy.value = '';
    await loadPush();
  }
};

// Admin : demandes d'accès en attente
const pending = computed(() => usersStore.users.filter((u) => Number(u.pending) === 1).length);

// Chiffres de l'en-tête : points ajoutés, amis, listes
const stats = ref(cached('me:stats') || {});
const loadStats = async () => {
  const [profile, lists] = await Promise.all([
    me.value.id ? request('GET', `${import.meta.env.VITE_PROFILE_ENDPOINT}/${me.value.id}`).catch(() => null) : null,
    request('GET', `${import.meta.env.VITE_FAVORITES_ENDPOINT}/summary`).catch(() => null),
  ]);
  stats.value = remember('me:stats', { spots: profile?.urbexCount, friends: profile?.friendCount, lists: Array.isArray(lists) ? lists.length : undefined });
};

const addLocation = () => window.dispatchEvent(new CustomEvent('a2:add-location'));
const logout = () => authStore.logout();

onMounted(async () => {
  if (!authStore.token) return;
  resolveDefaultCountry().then((c) => { country.value = remember('me:country', c); countrySetting.value = c?.setting || ''; });
  loadPush();
  if (!me.value.id) await authStore.fetchUserProfile().catch(() => {});
  loadStats();
  if (isAdmin.value || me.value.isAdmin === undefined) {
    if (me.value.isAdmin === undefined) await authStore.fetchUserProfile().catch(() => {});
    // badge « en attente » : la liste déjà chargée suffit, on la rafraîchit sans bloquer
    if (authStore.userProfile?.isAdmin) usersStore.getAll().catch(() => {});
  }
});

</script>

<template>
  <Title title="Profile" />
  <div class="ios-page ios-page--cols">
    <header class="me-hero">
      <router-link class="me-hero__id" :to="`/profile/${me.id}`">
        <img v-if="avatar && !avatarBroken" :src="avatar" alt="" class="me-hero__avatar" @error="avatarBroken = true" />
        <span v-else class="me-hero__avatar me-hero__avatar--initials">{{ initials }}</span>
        <span class="me-hero__name">
          <b>{{ me.username }}</b>
          <small>{{ demo ? 'Demo account' : isAdmin ? 'Admin' : 'Explorer' }} · View profile</small>
        </span>
      </router-link>
      <dl class="me-hero__stats">
        <div><dt>Spots added</dt><dd>{{ stats.spots ?? '–' }}</dd></div>
        <div><dt>Friends</dt><dd>{{ stats.friends ?? '–' }}</dd></div>
        <div><dt>Lists</dt><dd>{{ stats.lists ?? '–' }}</dd></div>
      </dl>
    </header>

    <section class="ios-section">
      <div class="ios-group">
        <button class="ios-row" @click="addLocation">
          <span class="ios-icon"><font-awesome-icon :icon="['fas', 'plus']" /></span>
          <span class="ios-row__label">Add a location</span>
        </button>
        <router-link class="ios-row" to="/friends" @click="navSource = 'profile'">
          <span class="ios-icon"><font-awesome-icon :icon="['fas', 'users']" /></span>
          <span class="ios-row__label">Friends</span>
          <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
        </router-link>
        <router-link v-if="!demo" class="ios-row" to="/edit-profile">
          <span class="ios-icon"><font-awesome-icon :icon="['fas', 'gear']" /></span>
          <span class="ios-row__label">Account settings</span>
          <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
        </router-link>
      </div>
    </section>

    <section class="ios-section">
      <div class="ios-group">
        <label class="ios-row" for="me-country">
          <span class="ios-icon"><font-awesome-icon :icon="['fas', 'earth-europe']" /></span>
          <span class="ios-row__label">Default country</span>
          <span class="ios-row__value">{{ countrySetting ? countryName : `Auto · ${countryName}` }}</span>
          <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
          <select id="me-country" class="ios-row__select" v-model="countrySetting" @change="saveCountry" aria-label="Default country">
            <option value="">Auto</option>
            <option v-for="c in country?.countries || []" :key="c.code" :value="c.code">{{ c.name }}</option>
          </select>
        </label>
        <router-link class="ios-row" to="/me/appearance">
          <span class="ios-icon"><font-awesome-icon :icon="['fas', 'palette']" /></span>
          <span class="ios-row__label">Appearance</span>
          <span class="ios-row__value accent-value"><i :style="{ background: accentNow.tint }"></i>{{ accentNow.label }}</span>
          <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
        </router-link>
      </div>
      <p class="ios-footer">
        <template v-if="country && !countrySetting">Country {{ SOURCE[country.source] }}.</template><template v-else>Used as the default filter on the map.</template>
      </p>
    </section>

    <section class="ios-section">
      <div class="ios-group">
        <router-link class="ios-row" to="/me/notifications">
          <span class="ios-icon"><font-awesome-icon :icon="['fas', 'bell']" /></span>
          <span class="ios-row__label">Notifications</span>
          <span class="ios-row__value">{{ canPush ? (pushOn ? 'On' : 'Off') : 'Not supported' }}</span>
          <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
        </router-link>
        <router-link v-if="isAdmin" class="ios-row" to="/admin" @click="navSource = 'profile'">
          <span class="ios-icon"><font-awesome-icon :icon="['fas', 'shield-halved']" /></span>
          <span class="ios-row__label">Administration</span>
          <span v-if="pending" class="ios-badge">{{ pending }}</span>
          <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
        </router-link>
      </div>
    </section>

    <section class="ios-section" v-if="exploration.active">
      <h3 class="ios-header">Exploration</h3>
      <div class="ios-group">
        <button class="ios-row ios-row--danger" @click="exploration.end(true)">Reset "{{ exploration.active.name }}"</button>
      </div>
    </section>


    <section class="ios-section">
      <div class="ios-group">
        <div class="ios-row">
          <span class="ios-row__label">Version</span>
          <span class="ios-row__value">{{ versionStore.code_version }}</span>
        </div>
        <!-- toujours là : force le téléchargement de la dernière version (vide les caches, recharge) -->
        <button class="ios-row ios-row--link" :disabled="updating" @click="updateNow">
          {{ updating ? 'Updating…' : versionStore.status === 'outdated' ? `Update to ${versionStore.latest_version}` : 'Update now' }}
        </button>
      </div>
      <p class="ios-footer">New versions install in the background and apply the next time you open the app. Update now applies the latest one right away.</p>
    </section>

    <section class="ios-section">
      <div class="ios-group">
        <button class="ios-row ios-row--danger" @click="logout">{{ demo ? 'Leave the demo' : 'Sign out' }}</button>
      </div>
    </section>
  </div>
</template>
