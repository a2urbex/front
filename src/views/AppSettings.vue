<script setup>
import { toast } from 'vue3-toastify';
import { forceAppUpdate } from '@/utilities/appUpdate';
import { computed, ref, onMounted } from 'vue';
import { request } from '@/services/api';
import { resolveDefaultCountry } from '@/stores/filter';
import { useAuthStore } from '@/stores/auth';
import { useExplorationStore } from '@/stores/exploration';
import { enablePush, disablePush, pushSupported, resetPush } from '@/services/push';
import { useVersionStore } from '@/stores/version';
import Title from '@/components/Title.vue';
const versionStore = useVersionStore();

const emit = defineEmits(['toggle-add-location']);
const latest_version = computed(() => versionStore.latest_version);
const code_version = computed(() => versionStore.code_version);
const status = computed(() => versionStore.status);


const country = ref(null);
const countrySetting = ref('');
onMounted(async () => {
  if (!useAuthStore().token) return;
  country.value = await resolveDefaultCountry();
  countrySetting.value = country.value?.setting || '';
});
const explorationStore = useExplorationStore();
const resetExploration = () => explorationStore.end(true);

const prefs = ref([]);
const pushOn = ref(false);
const canPush = pushSupported();
const loadPush = async () => {
  prefs.value = await request('GET', '/push/preferences');
  if (canPush) pushOn.value = Notification.permission === 'granted' && !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription());
};
const togglePush = async () => {
  try {
    if (pushOn.value) await disablePush();
    else if (!(await enablePush())) toast.error('Notifications were not allowed on this device.', { position: toast.POSITION.TOP_CENTER, theme: 'dark' });
  } catch (e) {
    toast.error(e.message, { position: toast.POSITION.TOP_CENTER, autoClose: 5000, theme: 'dark' });
  }
  await loadPush();
};
const resetting = ref(false);
const resetNotifications = async () => {
  resetting.value = true;
  try {
    const ok = await resetPush();
    if (!ok) throw new Error(Notification.permission === 'denied'
      ? 'Notifications are blocked for this app. Allow them in the phone settings, then try again.'
      : 'Notifications were not allowed.');
    await loadPush();
    toast.success('Notifications re-registered on this device. Send a test to check.', { position: toast.POSITION.TOP_CENTER, autoClose: 4000, theme: 'dark' });
  } catch (e) {
    toast.error(e.message, { position: toast.POSITION.TOP_CENTER, autoClose: 6000, theme: 'dark' });
    await loadPush();
  } finally {
    resetting.value = false;
  }
};

const testing = ref(false);
const testPush = async () => {
  testing.value = true;
  try {
    const res = await request('POST', '/push/test');
    const msg = res.error ? `Test failed: ${res.error}` : res.sent ? `Test sent to ${res.sent} device(s). It should arrive in a few seconds.` : 'No device registered. Turn "This device" on first.';
    (res.sent && !res.error ? toast.success : toast.error)(msg, { position: toast.POSITION.TOP_CENTER, autoClose: 5000, theme: 'dark' });
  } finally {
    testing.value = false;
  }
};
const togglePref = async (p) => {
  if (p.critical) return;
  p.enabled = !p.enabled;
  await request('PUT', '/push/preferences', { channel: p.channel, enabled: p.enabled });
};
onMounted(() => { if (useAuthStore().token) loadPush(); });

const sourceLabel = { account: 'account', geolocation: 'GPS position', ip: 'IP address', language: 'browser language', default: 'default' };
const saveCountry = async () => {
  await request('PUT', `${import.meta.env.VITE_ACCOUNT_ENDPOINT}/country`, { code: countrySetting.value || null });
  country.value = await resolveDefaultCountry();
};

const clearCache = forceAppUpdate;

</script>
<template>
  <Title title="App Settings" />
    <div class="app-settings">
        <img src="/logox192.png" class="app-settings__logo" alt="a2urbex logo" />
        <p class="app-settings__title">a2urbex @2026</p>

        <p class="app-settings__version"> Installed version: v{{ code_version }}</p>
        <p class="app-settings__version"> Latest version: v{{ latest_version }}</p>

            <div v-if="status === 'up-to-date'" class="app-settings__button refresh" @click="toggleOpen">
                <p class="uptodate">Up to date</p>
            </div>

            <div class="app-settings__section" v-if="country">
                <label class="app-settings__label" for="default-country">Default country</label>
                <select id="default-country" class="app-settings__select" v-model="countrySetting" @change="saveCountry">
                    <option value="">Auto</option>
                    <option v-for="c in country.countries" :key="c.code" :value="c.code">{{ c.name }}</option>
                </select>
                <p class="app-settings__hint" v-if="!countrySetting">Detected: {{ country.code }} ({{ sourceLabel[country.source] }})</p>
            </div>
            <div v-if="status === 'outdated'" @click="() => { clearCache(); toggleOpen(); }" class="app-settings__button refresh">
                <button class="outaded">Refresh App<font-awesome-icon :icon="['fa', 'rotate-right']" /> </button>
            </div>

            <div class="app-settings__section" v-if="prefs.length">
                <span class="app-settings__label">Notifications</span>
                <button v-if="canPush" class="app-settings__toggle" :class="{ on: pushOn }" @click="togglePush">
                    <span>This device</span><b>{{ pushOn ? 'On' : 'Off' }}</b>
                </button>
                <button v-if="pushOn" class="app-settings__test" :disabled="testing" @click="testPush">{{ testing ? 'Sending…' : 'Send a test notification' }}</button>
                <button v-if="canPush" class="app-settings__test app-settings__test--reset" :disabled="resetting" @click="resetNotifications">{{ resetting ? 'Re-registering…' : 'Reset notifications on this device' }}</button>
                <p v-if="canPush" class="app-settings__hint">Use it if notifications stopped arriving or the switch won't turn on.</p>
                <button v-for="p in prefs" :key="p.channel" class="app-settings__toggle" :class="{ on: p.enabled }" :disabled="p.critical" @click="togglePref(p)">
                    <span>{{ p.label }}</span><b>{{ p.critical ? 'Always' : p.enabled ? 'On' : 'Off' }}</b>
                </button>
            </div>

            <div class="app-settings__section" v-if="explorationStore.active">
                <span class="app-settings__label">Exploration in progress: {{ explorationStore.active.name }}</span>
                <button class="app-settings__reset" @click="resetExploration">Reset exploration</button>
            </div>
        </div>
</template>

<style lang="scss" scoped>
    @use '@/assets/styles/components/appSettings.scss' as *;
</style> 