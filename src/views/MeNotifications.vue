<script setup>
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import Title from '@/components/Title.vue';
import { request } from '@/services/api';
import { enablePush, disablePush, pushSupported, resetPush } from '@/services/push';

// Tout ce qui touche aux notifications, au même endroit : appareil, canaux, test, réinitialisation
const TOAST = { position: toast.POSITION.TOP_CENTER, theme: 'dark' };
const prefs = ref([]);
const pushOn = ref(false);
const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
const canPush = pushSupported();
const busy = ref('');

const load = async () => {
    prefs.value = (await request('GET', '/push/preferences')) || [];
    if (canPush) {
        permission.value = Notification.permission;
        pushOn.value = permission.value === 'granted' && !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription());
    }
};

const togglePush = async () => {
    busy.value = 'device';
    try {
        if (pushOn.value) await disablePush();
        else if (!(await enablePush())) toast.error(Notification.permission === 'denied' ? 'Notifications are blocked for this app in the phone settings.' : 'Notifications were not allowed.', { ...TOAST, autoClose: 5000 });
    } catch (e) {
        toast.error(e.message, { ...TOAST, autoClose: 5000 });
    } finally {
        busy.value = '';
        await load();
    }
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
        const msg = res.error ? `Test failed: ${res.error}` : res.sent ? `Test sent to ${res.sent} device(s). It should arrive in a few seconds.` : 'No device registered. Turn on "This device" first.';
        (res.sent && !res.error ? toast.success : toast.error)(msg, { ...TOAST, autoClose: 5000 });
    } finally {
        busy.value = '';
    }
};

const reset = async () => {
    busy.value = 'reset';
    try {
        if (!(await resetPush())) throw new Error(Notification.permission === 'denied' ? 'Notifications are blocked for this app. Allow them in the phone settings, then try again.' : 'Notifications were not allowed.');
        toast.success('Notifications re-registered on this device.', TOAST);
    } catch (e) {
        toast.error(e.message, { ...TOAST, autoClose: 6000 });
    } finally {
        busy.value = '';
        await load();
    }
};

const STATE = { granted: 'Allowed', denied: 'Blocked in phone settings', default: 'Not asked yet', unsupported: 'Not supported here' };

onMounted(load);
</script>

<template>
    <Title title="Notifications" />
    <div class="ios-page ios-page--cols">
        <section class="ios-section">
            <div class="ios-group">
                <button class="ios-row" :disabled="!canPush || busy === 'device'" @click="togglePush" role="switch" :aria-checked="pushOn">
                    <span class="ios-icon"><font-awesome-icon :icon="['fas', 'bell']" /></span>
                    <span class="ios-row__label">This device</span>
                    <span class="ios-switch" :class="{ on: pushOn }"></span>
                </button>
                <div class="ios-row ios-row--inset">
                    <span class="ios-row__label">Permission</span>
                    <span class="ios-row__value">{{ STATE[permission] || permission }}</span>
                </div>
            </div>
            <p class="ios-footer">On iPhone, notifications only work in the app added to the Home Screen.</p>
        </section>

        <section class="ios-section" v-if="prefs.length">
            <h3 class="ios-header">What to receive</h3>
            <div class="ios-group">
                <button v-for="p in prefs" :key="p.channel" class="ios-row ios-row--inset" :disabled="p.critical" @click="togglePref(p)" role="switch" :aria-checked="p.enabled">
                    <span class="ios-row__label">{{ p.label }}</span>
                    <span v-if="p.critical" class="ios-row__value">Always</span>
                    <span v-else class="ios-switch" :class="{ on: p.enabled }"></span>
                </button>
            </div>
            <p class="ios-footer">Import reports go to admins only. New spots: admins, and superusers who turn it on.</p>
        </section>

        <section class="ios-section">
            <h3 class="ios-header">Check</h3>
            <div class="ios-group">
                <button class="ios-row ios-row--inset ios-row--link" :disabled="busy === 'test'" @click="testPush">{{ busy === 'test' ? 'Sending…' : 'Send a test notification' }}</button>
                <button class="ios-row ios-row--inset ios-row--link" :disabled="!canPush || busy === 'reset'" @click="reset">{{ busy === 'reset' ? 'Re-registering…' : 'Reset notifications on this device' }}</button>
            </div>
            <p class="ios-footer">The test goes to all your registered devices. Reset if notifications stopped arriving or the switch won't turn on.</p>
        </section>
    </div>
</template>
