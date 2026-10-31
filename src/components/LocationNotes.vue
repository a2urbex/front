<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { toast } from 'vue3-toastify';
import { request } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

// Notes privées sur un point : un superuser écrit la sienne et lit celles de ses amis ; les admins voient (et peuvent supprimer) toutes les notes
const props = defineProps({ locationId: { type: String, required: true } });
const authStore = useAuthStore();
const isAdmin = computed(() => !!authStore.userProfile?.isAdmin);
const ENDPOINT = () => `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/${props.locationId}/notes`;
const TOAST = { position: 'top-center', theme: 'dark' };

const notes = ref([]);
const loading = ref(true);
const editing = ref(false);
const draft = ref('');
const saving = ref(false);

const mine = computed(() => notes.value.find((n) => n.mine) || null);
const others = computed(() => notes.value.filter((n) => !n.mine));

const load = async () => {
  loading.value = true;
  try { notes.value = (await request('GET', ENDPOINT())) || []; } catch { notes.value = []; } finally { loading.value = false; }
};
watch(() => props.locationId, load);
onMounted(load);

const startEdit = () => { draft.value = mine.value?.body || ''; editing.value = true; };
const save = async () => {
  saving.value = true;
  try {
    notes.value = (await request('PUT', ENDPOINT(), { body: draft.value })) || [];
    editing.value = false;
    toast.success(draft.value.trim() ? 'Note saved' : 'Note removed', TOAST);
  } catch {
    toast.error('The note could not be saved. Try again.', TOAST);
  } finally {
    saving.value = false;
  }
};
const remove = async (n) => {
  try {
    await request('DELETE', `${ENDPOINT()}/${n.id}`);
    notes.value = notes.value.filter((x) => x.id !== n.id);
    toast.success('Note removed', TOAST);
  } catch {
    toast.error('The note could not be removed.', TOAST);
  }
};

const when = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = (name) => (name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
</script>

<template>
  <section class="ln">
    <p class="ln__header">Private notes</p>

    <!-- Ma note -->
    <div class="ln__group">
      <template v-if="editing">
        <textarea :id="`note-${locationId}`" v-model="draft" class="ln__input" rows="4" maxlength="4000" placeholder="What should the admins know about this spot?"></textarea>
        <div class="ln__actions">
          <button class="ios-pill" :disabled="saving" @click="editing = false">Cancel</button>
          <button class="ios-pill ios-pill--tint" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </template>
      <button v-else-if="mine" class="ln__note ln__note--mine" @click="startEdit">
        <span class="ln__body">{{ mine.body }}</span>
        <small>Your note · {{ when(mine.updatedAt) }} · Tap to edit</small>
      </button>
      <button v-else class="ln__add" :disabled="loading" @click="startEdit">
        <font-awesome-icon :icon="['fas', 'pencil']" />{{ loading ? 'Loading notes…' : isAdmin ? 'Add a note' : 'Add a note for the admins' }}
      </button>
    </div>

    <!-- Notes des autres : celles des amis (superuser), toutes (admin) -->
    <div v-if="others.length" class="ln__group">
      <div v-for="n in others" :key="n.id" class="ln__note">
        <div class="ln__author">
          <span class="ln__avatar">{{ initials(n.author.username) }}</span>
          <b>{{ n.author.username }}</b>
          <small>{{ when(n.updatedAt) }}</small>
          <button v-if="isAdmin" class="ln__delete" :aria-label="`Delete the note from ${n.author.username}`" @click="remove(n)"><font-awesome-icon :icon="['fas', 'trash']" /></button>
        </div>
        <span class="ln__body">{{ n.body }}</span>
      </div>
    </div>

    <p class="ln__footer">{{ isAdmin ? 'Notes left by superusers. Each one sees only their own and their friends\' notes.' : 'Only you, your friends and the admins can see your note.' }}</p>
  </section>
</template>
