<script setup>
import { apiImage } from '@/utilities/apiImage';
import { ref, computed, reactive, onMounted } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useAuthStore } from '@/stores/auth';

// Personnes d'une liste : membres actuels, puis amis à ajouter (recherche)
const favoritesStore = useFavoritesStore();
const authStore = useAuthStore();
const props = defineProps({ favorite: Object });
const input = ref('');
const adding = ref(null);
const broken = reactive({});

// version à jour de la liste (après un ajout, le store est rechargé)
const current = computed(() => (favoritesStore.locationsList || []).find((f) => f.id === props.favorite?.id) || props.favorite || {});
const members = computed(() => current.value.users || []);
const candidates = computed(() => (favoritesStore.friends || []).filter((f) => !members.value.some((m) => m.id === f.id || m.username === f.username)));

const avatar = (u) => apiImage(u.image);
const initials = (u) => (u.username || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const isMe = (u) => u.username === authStore.userProfile?.username;

const search = () => props.favorite?.id && favoritesStore.getUserInList(props.favorite.id, input.value).catch(() => {});
const add = async (friend) => {
  adding.value = friend.id;
  try { await favoritesStore.addUserInlist(props.favorite.id, friend.id); } finally { adding.value = null; }
};

onMounted(search);
</script>

<template>
  <div class="fav-people">
    <p class="fav-people__header">In this list</p>
    <div class="fav-people__group">
      <div v-for="u in members" :key="u.id || u.username" class="fav-people__row">
        <img v-if="avatar(u) && !broken[u.username]" class="ios-avatar" :src="avatar(u)" alt="" @error="broken[u.username] = true" />
        <span v-else class="ios-avatar">{{ initials(u) }}</span>
        <span class="fav-people__name">{{ u.username }}<small v-if="isMe(u)"> · You</small></span>
      </div>
      <p v-if="!members.length" class="fav-people__empty">Only you for now.</p>
    </div>

    <p class="fav-people__header">Add a friend</p>
    <label class="ios-search fav-people__search" :for="`fav-people-${favorite?.id}`">
      <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
      <input :id="`fav-people-${favorite?.id}`" v-model="input" type="search" placeholder="Search friends" autocomplete="off" @input="search" />
    </label>
    <div class="fav-people__group">
      <div v-for="f in candidates" :key="f.id" class="fav-people__row">
        <img v-if="avatar(f) && !broken[f.username]" class="ios-avatar" :src="avatar(f)" alt="" @error="broken[f.username] = true" />
        <span v-else class="ios-avatar">{{ initials(f) }}</span>
        <span class="fav-people__name">{{ f.username }}</span>
        <button class="ios-pill ios-pill--tint" :disabled="adding === f.id" @click="add(f)">{{ adding === f.id ? 'Adding…' : 'Add' }}</button>
      </div>
      <p v-if="!candidates.length" class="fav-people__empty">{{ input ? `No friend matches "${input}".` : 'All your friends are already in this list.' }}</p>
    </div>
  </div>
</template>
