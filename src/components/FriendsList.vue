<script setup>
import { apiImage } from '@/utilities/apiImage';
import { onMounted, computed, ref, reactive } from 'vue';
import { useProfileStore } from '@/stores/profile';
import { useUsersStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue3-toastify';
import Title from '@/components/Title.vue';

// Amis : une recherche de personnes, trois onglets (amis, demandes reçues, envoyées), actions en feuille
const profileStore = useProfileStore();
const usersStore = useUsersStore();
const authStore = useAuthStore();
const TOAST = { position: toast.POSITION.TOP_CENTER, autoClose: 1200, theme: 'dark' };

const lists = computed(() => profileStore.friendsList || {});
const friends = computed(() => lists.value.friends || []);
const received = computed(() => lists.value.waiting || []);
const sent = computed(() => lists.value.pending || []);
const tab = ref('friends');
const query = ref('');
const sheetFor = ref(null);
const confirmRemove = ref(false);
const busy = ref(null);
const broken = reactive({}); // photos qui ne chargent pas → initiales

const people = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return (usersStore.users || []).filter((u) => u.id !== authStore.userProfile?.id && (u.username || '').toLowerCase().includes(q)).slice(0, 30);
});

const avatar = (u) => apiImage(u.image);
const initials = (u) => (u.username || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const relation = (u) => {
  if (friends.value.some((f) => f.id === u.id)) return 'Friend';
  if (sent.value.some((f) => f.id === u.id)) return 'Request sent';
  if (received.value.some((f) => f.id === u.id)) return 'Wants to be friends';
  return '';
};

const run = async (id, action, done) => {
  busy.value = id;
  try {
    await action(id);
    await profileStore.getFriends();
    toast.success(done, TOAST);
  } catch {
    toast.error('That did not work. Try again.', TOAST);
  } finally {
    busy.value = null;
  }
};
const accept = (u) => run(u.id, profileStore.acceptFriendRequest, `${u.username} is now your friend`);
const decline = (u) => run(u.id, profileStore.rejectFriendRequest, 'Request declined');

const openSheet = (u) => { sheetFor.value = u; confirmRemove.value = false; };
const closeSheet = () => { sheetFor.value = null; };
const removeOrCancel = async () => {
  const u = sheetFor.value;
  if (tab.value === 'friends' && !confirmRemove.value) { confirmRemove.value = true; return; }
  closeSheet();
  if (tab.value === 'friends') await run(u.id, profileStore.removeFriend, 'Friend removed');
  else await run(u.id, profileStore.cancelFriendRequest, 'Request cancelled');
};

onMounted(() => {
  profileStore.getFriends().catch(() => {});
  usersStore.getAll().catch(() => {});
});
</script>

<template>
  <Title title="Friends" />
  <div class="ios-page friends-page">
    <label class="ios-search" for="friends-search">
      <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
      <input id="friends-search" v-model="query" type="search" placeholder="Search people" autocomplete="off" />
    </label>

    <!-- Résultats de recherche -->
    <section v-if="query.trim()" class="ios-section">
      <h3 class="ios-header">People</h3>
      <div class="ios-group" v-if="people.length">
        <router-link v-for="u in people" :key="u.id" class="ios-row" :to="'/profile/' + u.id">
          <img v-if="avatar(u) && !broken[u.id]" class="ios-avatar" :src="avatar(u)" alt="" @error="broken[u.id] = true" />
          <span v-else class="ios-avatar">{{ initials(u) }}</span>
          <span class="ios-row__label">{{ u.username }}</span>
          <span class="ios-row__value">{{ relation(u) }}</span>
          <svg class="ios-chev" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.4 0 0 1.4 5.1 6.5 0 11.6 1.4 13l6.5-6.5Z" /></svg>
        </router-link>
      </div>
      <p v-else class="ios-footer">Nobody matches "{{ query }}".</p>
    </section>

    <template v-else>
      <div class="ios-segmented" role="tablist">
        <button role="tab" :aria-selected="tab === 'friends'" :class="{ on: tab === 'friends' }" @click="tab = 'friends'">Friends</button>
        <button role="tab" :aria-selected="tab === 'received'" :class="{ on: tab === 'received' }" @click="tab = 'received'">
          Requests<span v-if="received.length" class="ios-badge">{{ received.length }}</span>
        </button>
        <button role="tab" :aria-selected="tab === 'sent'" :class="{ on: tab === 'sent' }" @click="tab = 'sent'">Sent</button>
      </div>

      <section class="ios-section" v-if="tab === 'friends'">
        <div class="ios-group" v-if="friends.length">
          <div v-for="u in friends" :key="u.id" class="ios-row friends-row">
            <router-link class="friends-row__main" :to="'/profile/' + u.id">
              <img v-if="avatar(u) && !broken[u.id]" class="ios-avatar" :src="avatar(u)" alt="" @error="broken[u.id] = true" />
              <span v-else class="ios-avatar">{{ initials(u) }}</span>
              <span class="ios-row__label">{{ u.username }}</span>
            </router-link>
            <button class="list-row__more" :aria-label="`Actions for ${u.username}`" @click="openSheet(u)"><font-awesome-icon :icon="['fas', 'ellipsis']" /></button>
          </div>
        </div>
        <p v-else class="ios-footer">No friends yet. Search for someone above to send a request.</p>
      </section>

      <section class="ios-section" v-if="tab === 'received'">
        <div class="ios-group" v-if="received.length">
          <div v-for="u in received" :key="u.id" class="ios-row friends-row">
            <router-link class="friends-row__main" :to="'/profile/' + u.id">
              <img v-if="avatar(u) && !broken[u.id]" class="ios-avatar" :src="avatar(u)" alt="" @error="broken[u.id] = true" />
              <span v-else class="ios-avatar">{{ initials(u) }}</span>
              <span class="ios-row__label">{{ u.username }}</span>
            </router-link>
            <span class="friends-row__actions">
              <button class="ios-pill" :disabled="busy === u.id" @click="decline(u)">Decline</button>
              <button class="ios-pill ios-pill--tint" :disabled="busy === u.id" @click="accept(u)">Accept</button>
            </span>
          </div>
        </div>
        <p v-else class="ios-footer">No friend request right now.</p>
      </section>

      <section class="ios-section" v-if="tab === 'sent'">
        <div class="ios-group" v-if="sent.length">
          <div v-for="u in sent" :key="u.id" class="ios-row friends-row">
            <router-link class="friends-row__main" :to="'/profile/' + u.id">
              <img v-if="avatar(u) && !broken[u.id]" class="ios-avatar" :src="avatar(u)" alt="" @error="broken[u.id] = true" />
              <span v-else class="ios-avatar">{{ initials(u) }}</span>
              <span class="ios-row__label">{{ u.username }}</span>
              <span class="ios-row__value">Waiting</span>
            </router-link>
            <button class="list-row__more" :aria-label="`Actions for ${u.username}`" @click="openSheet(u)"><font-awesome-icon :icon="['fas', 'ellipsis']" /></button>
          </div>
        </div>
        <p v-else class="ios-footer">You have no request waiting for an answer.</p>
      </section>
    </template>
  </div>

  <Teleport to="body">
    <div v-if="sheetFor" class="ios-sheet-backdrop" @click.self="closeSheet">
      <div class="ios-action-sheet" role="dialog" :aria-label="`${sheetFor.username} actions`" v-swipe-close="closeSheet">
        <div class="ios-action-sheet__group">
          <p class="ios-action-sheet__title">{{ sheetFor.username }}</p>
          <router-link class="ios-action-sheet__btn" :to="'/profile/' + sheetFor.id" @click="closeSheet"><font-awesome-icon :icon="['fas', 'circle-user']" />View profile</router-link>
          <button class="ios-action-sheet__btn is-danger" @click="removeOrCancel">
            <font-awesome-icon :icon="['fas', tab === 'friends' ? 'trash' : 'xmark']" />
            <template v-if="tab === 'friends'">{{ confirmRemove ? 'Tap again to remove' : 'Remove friend' }}</template>
            <template v-else>Cancel request</template>
          </button>
        </div>
        <button class="ios-action-sheet__btn ios-action-sheet__cancel" @click="closeSheet">Cancel</button>
      </div>
    </div>
  </Teleport>
</template>
