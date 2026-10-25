<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Title from '@/components/Title.vue';
import FavoritesEditor from '@/components/FavoritesEditor.vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useExplorationStore } from '@/stores/exploration';

// Lists / Outings : lignes groupées iOS ; ⋯ ouvre les actions de la liste en feuille d'actions
const favoritesStore = useFavoritesStore();
const exploration = useExplorationStore();
const route = useRoute();
const isOutings = computed(() => route.query.view === 'outings');
const isLoading = computed(() => favoritesStore.loading);
const query = ref('');
const sheetFor = ref(null);

const all = computed(() => {
    const q = query.value.trim().toLowerCase();
    return (favoritesStore.locationsList || []).filter((f) => !q || (f.name || '').toLowerCase().includes(q));
});
const running = computed(() => all.value.filter((f) => f.status === 'in_progress'));
const others = computed(() => {
    // Outings = historique : listes déjà explorées ; Lists = tout sauf l'exploration en cours
    if (isOutings.value) return all.value.filter((f) => f.status === 'finished');
    return all.value.filter((f) => f.status !== 'in_progress');
});

const subtitle = (f) => {
    const parts = [`${f.count} spot${f.count === 1 ? '' : 's'}`];
    if ((f.users?.length || 0) > 1) parts.push(`shared with ${f.users.length - 1}`);
    if (f.disabled === 1) parts.push('hidden');
    if (f.status === 'in_progress' && exploration.active?.favoriteId === f.id) parts.push('exploring now');
    return parts.join(' · ');
};

onMounted(async () => {
    await favoritesStore.getList();
});
</script>

<template>
    <Title :title="isOutings ? 'Outings' : 'Lists'" />
    <div class="ios-page lists-page">
        <label class="ios-search" for="lists-search">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
            <input id="lists-search" v-model="query" type="search" :placeholder="isOutings ? 'Search outings' : 'Search lists'" autocomplete="off" />
        </label>

        <section class="ios-section" v-if="running.length">
            <h3 class="ios-header">Exploring now</h3>
            <div class="ios-group">
                <div v-for="f in running" :key="f.id" class="ios-row list-row">
                    <router-link class="list-row__main" :to="`/favorites/${f.id}`">
                        <span class="list-row__icon is-live"><font-awesome-icon :icon="['fas', 'compass']" /></span>
                        <span class="list-row__text"><b>{{ f.name }}</b><small>{{ subtitle(f) }}</small></span>
                        <span class="list-badge is-live">Live</span>
                    </router-link>
                    <button class="list-row__more" @click="sheetFor = f" aria-label="List actions"><font-awesome-icon :icon="['fas', 'ellipsis']" /></button>
                </div>
            </div>
        </section>

        <section class="ios-section" v-if="others.length">
            <h3 class="ios-header">{{ isOutings ? 'Explored' : 'My lists' }}</h3>
            <div class="ios-group">
                <div v-for="f in others" :key="f.id" class="ios-row list-row">
                    <router-link class="list-row__main" :to="`/favorites/${f.id}`">
                        <span class="list-row__icon" :class="{ 'is-done': f.status === 'finished' }">
                            <font-awesome-icon :icon="['fas', f.status === 'finished' ? 'check' : 'list-ul']" />
                        </span>
                        <span class="list-row__text"><b>{{ f.name }}</b><small>{{ subtitle(f) }}</small></span>
                        <span v-if="f.status === 'finished'" class="list-badge is-done">Explored</span>
                    </router-link>
                    <button class="list-row__more" @click="sheetFor = f" aria-label="List actions"><font-awesome-icon :icon="['fas', 'ellipsis']" /></button>
                </div>
            </div>
            <p class="ios-footer" v-if="!isOutings">Open a list and tap Start exploration to head out with it.</p>
        </section>

        <p v-if="!isLoading && !running.length && !others.length" class="lists-empty">
            <template v-if="query">No list matches "{{ query }}".</template>
            <template v-else-if="isOutings">No outing yet. Open a list and tap Start exploration.</template>
            <template v-else>No list yet. Save a spot with the heart to create your first list.</template>
        </p>
    </div>

    <Teleport to="body">
        <div v-if="sheetFor" class="ios-sheet-backdrop" @click.self="sheetFor = null">
            <FavoritesEditor :favorite="sheetFor" @close="sheetFor = null" />
        </div>
    </Teleport>
</template>

<style lang="scss">
@use '@/assets/styles/components/favoritesList.scss' as *;
</style>
